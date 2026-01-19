using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpingHands.Server.Data.Migrations
{
    [Migration("20260110200000_AddFoodStampFields_Fix")]
    public partial class AddFoodStampFields_Fix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"FoodStampsAmount\" numeric;");
            migrationBuilder.Sql("ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"FoodStampsDateAvailable\" date;");
            migrationBuilder.Sql("ALTER TABLE \"Applications\" ADD COLUMN IF NOT EXISTS \"ReceivesFoodStamps\" boolean;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Applications\" DROP COLUMN IF EXISTS \"FoodStampsAmount\";");
            migrationBuilder.Sql("ALTER TABLE \"Applications\" DROP COLUMN IF EXISTS \"FoodStampsDateAvailable\";");
            migrationBuilder.Sql("ALTER TABLE \"Applications\" DROP COLUMN IF EXISTS \"ReceivesFoodStamps\";");
        }
    }
}
