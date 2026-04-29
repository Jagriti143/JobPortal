using JobCatalogService.Data;
using JobCatalogService.Data.Entities;
using JobCatalogService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace JobCatalogService.Repositories;

public class CompanyRepository(JobDbContext db) : ICompanyRepository
{
    public Task<Company?> GetCompanyByIdAsync(Guid companyId)
    {
        return db.Companies.FindAsync(companyId).AsTask();
    }

    public Task<List<CompanyReview>> GetApprovedReviewsAsync(Guid companyId)
    {
        return db.CompanyReviews
            .Where(r => r.CompanyId == companyId && r.IsApproved)
            .ToListAsync();
    }

    public Task AddReviewAsync(CompanyReview review)
    {
        db.CompanyReviews.Add(review);
        return db.SaveChangesAsync();
    }
    public Task AddCompanyAsync(Company company)
    {
        db.Companies.Add(company);
        return db.SaveChangesAsync();
    }
}
