using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpingHands.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodStampFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FoodStampsAmount",
                table: "Applications",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FoodStampsDateAvailable",
                table: "Applications",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReceivesFoodStamps",
                table: "Applications",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FoodStampsAmount",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "FoodStampsDateAvailable",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "ReceivesFoodStamps",
                table: "Applications");
        }
    }
}
