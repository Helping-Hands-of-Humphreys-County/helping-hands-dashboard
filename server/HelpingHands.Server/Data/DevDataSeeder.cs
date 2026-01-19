using HelpingHands.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Data;

public static class DevDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        const string email = "admin@example.com";
        const string password = "#D3vpassword";

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            if (!existing.IsActive)
            {
                existing.IsActive = true;
                existing.UpdatedAt = DateTimeOffset.UtcNow;
                await userManager.UpdateAsync(existing);
            }
        }
        else
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                DisplayName = "Admin",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed dev user: {errors}");
            }
        }

        await db.SaveChangesAsync();

        var adminId = (await userManager.FindByEmailAsync(email))!.Id;

        // Seed sample domain data only if empty to avoid duplication on re-run
        if (!await db.Households.AnyAsync())
        {
            var now = DateTimeOffset.UtcNow;

            // Create a variety of households with 1..5 members
            var households = Enumerable.Range(1, 6).Select(i => new Household
            {
                Id = Guid.NewGuid(),
                Street1 = $"{100 + i} Example Ave",
                City = i % 2 == 0 ? "Waverly" : "Springfield",
                State = "TN",
                Zip = (37000 + i).ToString(),
                CreatedAt = now,
                UpdatedAt = now,
            }).ToList();

            var clients = new List<Client>();

            // For each household, create between 1 and 6 clients (varying sizes)
            for (var h = 0; h < households.Count; h++)
            {
                var memberCount = h + 1; // 1..6
                for (var m = 0; m < memberCount; m++)
                {
                    var c = new Client
                    {
                        Id = Guid.NewGuid(),
                        Household = households[h],
                        FirstName = $"Member{h + 1}_{m + 1}",
                        LastName = "Family",
                        Dob = new DateOnly(1980 + (m % 30), 1, 1),
                        Phone = $"615-555-{1000 + h * 10 + m}",
                        CreatedAt = now,
                        UpdatedAt = now,
                    };
                    clients.Add(c);
                }
            }

            // (Note) We're not creating Application rows here to avoid schema coupling
            // with older dev databases. Applications can be created through the UI.
            var appHousehold = households[0];
            var appApplicant = clients.First(c => c.Household == appHousehold);

            // Create assistance events for several households, setting HouseholdMemberCount
            var assistanceEvents = new List<AssistanceEvent>();

            // HelpingHands assistance for household 1 (partial rent for household size)
            assistanceEvents.Add(new AssistanceEvent
            {
                Id = Guid.NewGuid(),
                ProgramType = "HelpingHands",
                OccurredAt = now.AddDays(-1),
                Household = households[0],
                HouseholdId = households[0].Id,
                HouseholdMemberCount = clients.Count(c => c.Household == households[0]),
                Client = appApplicant,
                ClientId = appApplicant.Id,
                BillType = "Rent",
                AmountPaid = 300m,
                CheckNumber = "2001",
                Notes = "Partial rent assistance",
                RecordedByUserId = adminId,
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1),
            });

            // FoodPantry pickups for multiple households
            for (var i = 1; i <= 4; i++)
            {
                var hh = households[i];
                var primaryClient = clients.First(c => c.Household == hh);
                assistanceEvents.Add(new AssistanceEvent
                {
                    Id = Guid.NewGuid(),
                    ProgramType = "FoodPantry",
                    OccurredAt = now.AddDays(-i),
                    Household = hh,
                    HouseholdId = hh.Id,
                    HouseholdMemberCount = clients.Count(c => c.Household == hh),
                    Client = primaryClient,
                    ClientId = primaryClient.Id,
                    BillType = null,
                    AmountPaid = null,
                    Notes = "Food pantry pickup",
                    RecordedByUserId = adminId,
                    CreatedAt = now.AddDays(-i),
                    UpdatedAt = now.AddDays(-i),
                    Items =
                    {
                        new AssistanceItem { Id = Guid.NewGuid(), ItemType = "FoodBox", Quantity = 1 },
                        new AssistanceItem { Id = Guid.NewGuid(), ItemType = "Milk", Quantity = 1 }
                    }
                });
            }

            // Add all entities (applications intentionally excluded)
            db.Households.AddRange(households);
            db.Clients.AddRange(clients);
            db.AssistanceEvents.AddRange(assistanceEvents);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
            {
                // Fallback: as a safer approach, try saving households and clients first,
                // then save assistance events (without any Application links). This
                // avoids problems when Applications table schema doesn't match.
                Console.WriteLine("DevDataSeeder: primary save failed, attempting fallback seed. Error: " + ex.Message);

                // Ensure change tracker is clean for AssistanceEvents
                foreach (var entry in db.ChangeTracker.Entries<AssistanceEvent>().ToList())
                {
                    entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
                }

                // Save households and clients if not present
                if (!await db.Households.AnyAsync()) db.Households.AddRange(households);
                if (!await db.Clients.AnyAsync()) db.Clients.AddRange(clients);
                await db.SaveChangesAsync();

                // Recreate assistance event instances without any Application references
                var detachedAssistance = assistanceEvents.Select(a => new AssistanceEvent
                {
                    Id = a.Id,
                    ProgramType = a.ProgramType,
                    OccurredAt = a.OccurredAt,
                    HouseholdId = a.HouseholdId,
                    HouseholdMemberCount = a.HouseholdMemberCount,
                    ClientId = a.ClientId,
                    BillType = a.BillType,
                    AmountPaid = a.AmountPaid,
                    CheckNumber = a.CheckNumber,
                    Notes = a.Notes,
                    RecordedByUserId = a.RecordedByUserId,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    Items = a.Items.Select(i => new AssistanceItem { Id = Guid.NewGuid(), ItemType = i.ItemType, Quantity = i.Quantity }).ToList()
                }).ToList();

                // Only add assistance events that don't already exist
                foreach (var ae in detachedAssistance)
                {
                    if (!await db.AssistanceEvents.AnyAsync(x => x.Id == ae.Id))
                        db.AssistanceEvents.Add(ae);
                }

                await db.SaveChangesAsync();
            }
        }
    }
}
