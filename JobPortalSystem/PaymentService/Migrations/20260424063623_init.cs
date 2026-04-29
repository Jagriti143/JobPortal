using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentService.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PointsDeductionRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsDeductionRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecruiterUnlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecruiterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnlockType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecruiterUnlocks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecruiterWallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecruiterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PointsBalance = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecruiterWallets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UnlockResumeSagaStates",
                columns: table => new
                {
                    CorrelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentState = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    RecruiterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResumeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PointsToDeduct = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnlockResumeSagaStates", x => x.CorrelationId);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RazorpayPaymentId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_RecruiterWallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "RecruiterWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecruiterUnlocks_RecruiterId_ResourceId_UnlockType",
                table: "RecruiterUnlocks",
                columns: new[] { "RecruiterId", "ResourceId", "UnlockType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecruiterWallets_RecruiterId",
                table: "RecruiterWallets",
                column: "RecruiterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_IdempotencyKey",
                table: "Transactions",
                column: "IdempotencyKey",
                unique: true,
                filter: "[IdempotencyKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Type_CreatedAt",
                table: "Transactions",
                columns: new[] { "Type", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_WalletId_CreatedAt",
                table: "Transactions",
                columns: new[] { "WalletId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PointsDeductionRules");

            migrationBuilder.DropTable(
                name: "RecruiterUnlocks");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "UnlockResumeSagaStates");

            migrationBuilder.DropTable(
                name: "RecruiterWallets");
        }
    }
}
