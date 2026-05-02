using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobCatalogService.Migrations
{
    /// <inheritdoc />
    public partial class AddRecruiterIdToCompany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RecruiterId",
                table: "Companies",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Companies_RecruiterId",
                table: "Companies",
                column: "RecruiterId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Companies_RecruiterId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RecruiterId",
                table: "Companies");
        }
    }
}
