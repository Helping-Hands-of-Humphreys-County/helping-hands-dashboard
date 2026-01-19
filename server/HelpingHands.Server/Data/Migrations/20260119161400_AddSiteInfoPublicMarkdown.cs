using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpingHands.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteInfoPublicMarkdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicMarkdown",
                table: "SiteInfo",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SiteInfo",
                keyColumn: "Id",
                keyValue: 1,
                column: "PublicMarkdown",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublicMarkdown",
                table: "SiteInfo");
        }
    }
}
