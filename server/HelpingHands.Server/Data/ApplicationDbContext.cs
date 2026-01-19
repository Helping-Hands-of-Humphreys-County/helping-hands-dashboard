using HelpingHands.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Data;

public class ApplicationDbContext
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<SiteInfo> SiteInfo => Set<SiteInfo>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<ApplicationHouseholdMember> ApplicationHouseholdMembers => Set<ApplicationHouseholdMember>();
    public DbSet<ApplicationBillRequest> ApplicationBillRequests => Set<ApplicationBillRequest>();
    public DbSet<AssistanceEvent> AssistanceEvents => Set<AssistanceEvent>();
    public DbSet<AssistanceItem> AssistanceItems => Set<AssistanceItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(entity =>
        {
            entity.Property(x => x.DisplayName).HasMaxLength(200);
        });

        builder.Entity<SiteInfo>(entity =>
        {
            entity.HasKey(x => x.Id);

            // Seed a single row so GET /site-info works without manual DB setup.
            entity.HasData(new SiteInfo
            {
                Id = 1,
                AboutText = "",
                ProgramsOverview = "",
                HoursText = "",
                LocationText = "",
                ContactText = "",
                WhatToBringText = "",
                UpdatedAt = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero)
            });
        });

        builder.Entity<Household>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Street1).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Street2).HasMaxLength(200);
            entity.Property(x => x.City).HasMaxLength(100).IsRequired();
            entity.Property(x => x.State).HasMaxLength(2).IsRequired();
            entity.Property(x => x.Zip).HasMaxLength(20);

            entity.HasIndex(x => new { x.Street1, x.City, x.State, x.Zip });
        });

        builder.Entity<Client>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(50);

            entity.HasIndex(x => new { x.LastName, x.FirstName });
            entity.HasIndex(x => x.Phone);
            entity.HasIndex(x => x.HouseholdId);

            entity.HasOne(x => x.Household)
                .WithMany(x => x.Clients)
                .HasForeignKey(x => x.HouseholdId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ClientNote>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Body).IsRequired();

            entity.HasIndex(x => new { x.ClientId, x.CreatedAt });

            entity.HasOne(x => x.Client)
                .WithMany(x => x.Notes)
                .HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.AuthorUser)
                .WithMany()
                .HasForeignKey(x => x.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Application>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProgramType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Decision).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EmergencySummary).IsRequired();

            entity.HasIndex(x => new { x.ProgramType, x.SubmittedAt });
            entity.HasIndex(x => new { x.Status, x.SubmittedAt });
            entity.HasIndex(x => new { x.ApplicantClientId, x.SubmittedAt });
            entity.HasIndex(x => new { x.HouseholdId, x.SubmittedAt });

            entity.HasOne(x => x.ApplicantClient)
                .WithMany(x => x.Applications)
                .HasForeignKey(x => x.ApplicantClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Household)
                .WithMany(x => x.Applications)
                .HasForeignKey(x => x.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.VerifiedByUser)
                .WithMany()
                .HasForeignKey(x => x.VerifiedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.UpdatedByUser)
                .WithMany()
                .HasForeignKey(x => x.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ApplicationHouseholdMember>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.RelationshipToApplicant).HasMaxLength(100);
            entity.Property(x => x.IncomeSource).HasMaxLength(100);

            entity.HasIndex(x => x.ApplicationId);
            entity.HasIndex(x => x.ClientId);

            entity.HasOne(x => x.Application)
                .WithMany(x => x.HouseholdMembers)
                .HasForeignKey(x => x.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Client)
                .WithMany()
                .HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ApplicationBillRequest>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.BillType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.AccountNumber).HasMaxLength(100);

            entity.HasIndex(x => x.ApplicationId);

            entity.HasOne(x => x.Application)
                .WithMany(x => x.BillRequests)
                .HasForeignKey(x => x.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AssistanceEvent>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProgramType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.BillType).HasMaxLength(100);
            entity.Property(x => x.CheckNumber).HasMaxLength(100);

            entity.HasIndex(x => new { x.ProgramType, x.OccurredAt });
            entity.HasIndex(x => new { x.HouseholdId, x.OccurredAt });
            entity.HasIndex(x => x.ApplicationId);

            entity.HasOne(x => x.Household)
                .WithMany(x => x.AssistanceEvents)
                .HasForeignKey(x => x.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Client)
                .WithMany(x => x.AssistanceEvents)
                .HasForeignKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Application)
                .WithMany(x => x.AssistanceEvents)
                .HasForeignKey(x => x.ApplicationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.RecordedByUser)
                .WithMany()
                .HasForeignKey(x => x.RecordedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AssistanceItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ItemType).HasMaxLength(100).IsRequired();

            entity.HasIndex(x => x.AssistanceEventId);

            entity.HasOne(x => x.AssistanceEvent)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.AssistanceEventId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
