using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using System.Data;
using System.Data.Common;

namespace HelpingHands.Server.Data;

public static class DevDatabaseBootstrapper
{
    public static async Task EnsureMigratedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();

        // If this DB was previously created with EnsureCreated(), it can have tables
        // but be missing __EFMigrationsHistory. That causes Migrate() to try creating
        // tables that already exist. In Development, baseline ONLY when the DB already
        // has tables but the migrations history table is missing.

        var conn = db.Database.GetDbConnection();
        await db.Database.OpenConnectionAsync();

        var anyUserTablesExist = await AnyUserTablesExistAsync(conn);

        if (anyUserTablesExist)
        {
            var historyExists = await ExistsTableAsync(conn, "__EFMigrationsHistory");

            if (!historyExists)
            {
                await using var cmd = conn.CreateCommand();
                cmd.CommandText =
                    "CREATE TABLE IF NOT EXISTS \"__EFMigrationsHistory\" (\"MigrationId\" character varying(150) NOT NULL, \"ProductVersion\" character varying(32) NOT NULL, CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY (\"MigrationId\"));";
                await cmd.ExecuteNonQueryAsync();
            }

            var productVersion = ProductInfo.GetVersion();
            foreach (var migrationId in db.Database.GetMigrations())
            {
                await using var insert = conn.CreateCommand();
                insert.CommandText =
                    "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES (@migrationId, @productVersion) ON CONFLICT (\"MigrationId\") DO NOTHING;";

                var p1 = insert.CreateParameter();
                p1.ParameterName = "migrationId";
                p1.Value = migrationId;
                insert.Parameters.Add(p1);

                var p2 = insert.CreateParameter();
                p2.ParameterName = "productVersion";
                p2.Value = productVersion;
                insert.Parameters.Add(p2);

                await insert.ExecuteNonQueryAsync();
            }
        }

        await db.Database.CloseConnectionAsync();

        await db.Database.MigrateAsync();
        // Ensure certain dev-only columns exist even if migrations are out-of-sync
        try
        {
            var conn2 = db.Database.GetDbConnection();
            await db.Database.OpenConnectionAsync();
            await using var cmd = conn2.CreateCommand();
            cmd.CommandText = "ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"FoodStampsAmount\" numeric;";
            await cmd.ExecuteNonQueryAsync();
            cmd.CommandText = "ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"FoodStampsDateAvailable\" date;";
            await cmd.ExecuteNonQueryAsync();
            cmd.CommandText = "ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"ReceivesFoodStamps\" boolean;";
            await cmd.ExecuteNonQueryAsync();
                // Ensure the users table has the MustChangePassword column in dev
                cmd.CommandText = "ALTER TABLE \"AspNetUsers\" ADD COLUMN IF NOT EXISTS \"MustChangePassword\" boolean DEFAULT false;";
                await cmd.ExecuteNonQueryAsync();
            await db.Database.CloseConnectionAsync();
        }
        catch
        {
            // swallow — we don't want this to block migrations, seeding may fail later if truly incompatible
        }
    }

    private static async Task<bool> ExistsTableAsync(DbConnection conn, string tableName)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @tableName);";

        var p = cmd.CreateParameter();
        p.ParameterName = "tableName";
        p.Value = tableName;
        cmd.Parameters.Add(p);

        var result = await cmd.ExecuteScalarAsync();
        return result is bool b && b;
    }

    private static async Task<bool> AnyUserTablesExistAsync(DbConnection conn)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '__EFMigrationsHistory');";

        var result = await cmd.ExecuteScalarAsync();
        return result is bool b && b;
    }
}
