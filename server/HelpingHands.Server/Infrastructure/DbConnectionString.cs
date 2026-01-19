using System;
using Microsoft.Extensions.Configuration;

namespace HelpingHands.Server.Infrastructure;

public static class DbConnectionString
{
    public static string Resolve(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            return FromDatabaseUrl(databaseUrl);
        }

        throw new InvalidOperationException(
            "Database connection string not configured. Set ConnectionStrings:Default or DATABASE_URL.");
    }

    private static string FromDatabaseUrl(string databaseUrl)
    {
        // Accept common variants produced by cloud providers:
        // - postgres://user:password@host:port/dbname
        // - postgresql://user:password@host:port/dbname
        // - or occasionally values missing the scheme

        if (string.IsNullOrWhiteSpace(databaseUrl))
            throw new InvalidOperationException("DATABASE_URL is empty.");

        // normalize postgresql:// -> postgres://
        if (databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            databaseUrl = "postgres://" + databaseUrl.Substring("postgresql://".Length);
        }

        // if no scheme present, assume postgres
        if (!databaseUrl.Contains("://"))
        {
            databaseUrl = "postgres://" + databaseUrl;
        }

        Uri uri;
        try
        {
            uri = new Uri(databaseUrl);
        }
        catch (UriFormatException ex)
        {
            throw new InvalidOperationException($"DATABASE_URL is not a valid URI: '{databaseUrl}'", ex);
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty;
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;

        var database = uri.AbsolutePath.TrimStart('/');

        var port = uri.Port > 0 ? uri.Port : 5432;

        return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};Ssl Mode=Require;Trust Server Certificate=true";
    }
}
