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
        // Expected format: postgres://user:password@host:port/dbname
        var uri = new Uri(databaseUrl);

        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";

        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={uri.Host};Port={uri.Port};Database={database};Username={username};Password={password};Ssl Mode=Require;Trust Server Certificate=true";
    }
}
