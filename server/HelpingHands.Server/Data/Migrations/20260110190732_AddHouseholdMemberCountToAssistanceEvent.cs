using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpingHands.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdMemberCountToAssistanceEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HouseholdMemberCount",
                table: "AssistanceEvents",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HouseholdMemberCount",
                table: "AssistanceEvents");
        }
    }
}
