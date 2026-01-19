using HelpingHands.Server.Data;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAutoMapper(typeof(Program).Assembly);

var connectionString = DbConnectionString.Resolve(builder.Configuration);

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

builder.Services.AddAuthorization();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    if (builder.Environment.IsDevelopment())
    {
        // Local dev: allow http cookies so Vite proxy works without https
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    }
    else
    {
        // Prod: cross-site friendly and secure-only
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    }

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SiteInfoService>();
builder.Services.AddScoped<ClientsService>();
builder.Services.AddScoped<ClientNotesService>();
builder.Services.AddScoped<HouseholdsService>();
builder.Services.AddScoped<ApplicationsService>();
builder.Services.AddScoped<AssistanceService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<UsersService>();
builder.Services.AddScoped<ReportsService>();
// Register email sender: use SMTP if configured, otherwise a noop sender.
if (!string.IsNullOrWhiteSpace(builder.Configuration["Smtp:Host"]))
{
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, NoopEmailSender>();
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    await DevDatabaseBootstrapper.EnsureMigratedAsync(scope.ServiceProvider);

    await DevDataSeeder.SeedAsync(scope.ServiceProvider);
}

// If a default admin is configured via configuration (env or secrets), ensure it's present.
using (var scope = app.Services.CreateScope())
{
    try
    {
        await ProductionAdminSeeder.EnsureAdminAsync(scope.ServiceProvider, app.Configuration);
    }
    catch (Exception ex)
    {
        Console.WriteLine("ProductionAdminSeeder failed: " + ex.Message);
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("Client");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
