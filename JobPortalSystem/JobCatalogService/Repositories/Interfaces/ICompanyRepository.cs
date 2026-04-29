using JobCatalogService.Data.Entities;

namespace JobCatalogService.Repositories.Interfaces;

public interface ICompanyRepository
{
    Task<Company?> GetCompanyByIdAsync(Guid companyId);
    Task<List<CompanyReview>> GetApprovedReviewsAsync(Guid companyId);
    Task AddReviewAsync(CompanyReview review);
    Task AddCompanyAsync(Company company);
}
