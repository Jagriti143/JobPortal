using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApplicationService.Migrations
{
    /// <inheritdoc />
    public partial class createinit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobSeekerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobSeekerEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResumeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CoverLetter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AppliedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Applications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Applications_JobId_Status",
                table: "Applications",
                columns: new[] { "JobId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Applications_JobSeekerId_JobId",
                table: "Applications",
                columns: new[] { "JobSeekerId", "JobId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Applications_JobSeekerId_Status",
                table: "Applications",
                columns: new[] { "JobSeekerId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Applications");
        }
    }
}
