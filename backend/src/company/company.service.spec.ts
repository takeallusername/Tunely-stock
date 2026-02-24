import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/mysql';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { UserCompany } from '../user-company/entities/user-company.entity';
import { Financial } from '../financial/entities/financial.entity';
import { StockData } from '../stock/entities/stock-data.entity';
import { StockHistory } from '../stock/entities/stock-history.entity';
import { DartService } from '../dart/dart.service';
import { NaverFinanceService } from '../crawler/naver-finance.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockCompanyRepo: any;
  let mockUserCompanyRepo: any;
  let mockFinancialRepo: any;
  let mockStockDataRepo: any;
  let mockStockHistoryRepo: any;
  let mockEntityManager: any;
  let mockDartService: any;
  let mockNaverFinanceService: any;

  beforeEach(async () => {
    mockCompanyRepo = {
      findByCorpCode: jest.fn(),
      findOneOrFail: jest.fn(),
      findByIdWithRelations: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    };

    mockUserCompanyRepo = {
      findByUserAndCompany: jest.fn(),
      findByUserId: jest.fn(),
      findByUserAndCompanyId: jest.fn(),
      removeAndFlush: jest.fn(),
      persist: jest.fn(),
    };

    mockFinancialRepo = {
      findByCompanyYearQuarter: jest.fn(),
      persist: jest.fn(),
    };

    mockStockDataRepo = {
      findTodayData: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockStockHistoryRepo = {
      findByCompanyAndDate: jest.fn(),
      findByCompanyAndDateRange: jest.fn(),
      persist: jest.fn(),
    };

    mockEntityManager = {
      create: jest.fn((_entity, data) => ({ ...data, id: 1 })),
      flush: jest.fn(),
    };

    mockDartService = {
      searchCompanyByName: jest.fn(),
      getFinancialStatements: jest.fn(),
    };

    mockNaverFinanceService = {
      getStockInfo: jest.fn(),
      getStockHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepo,
        },
        {
          provide: getRepositoryToken(UserCompany),
          useValue: mockUserCompanyRepo,
        },
        {
          provide: getRepositoryToken(Financial),
          useValue: mockFinancialRepo,
        },
        {
          provide: getRepositoryToken(StockData),
          useValue: mockStockDataRepo,
        },
        {
          provide: getRepositoryToken(StockHistory),
          useValue: mockStockHistoryRepo,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: DartService,
          useValue: mockDartService,
        },
        {
          provide: NaverFinanceService,
          useValue: mockNaverFinanceService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should call dartService.searchCompanyByName', async () => {
      const mockResult = [
        { corpCode: '00126380', corpName: '삼성전자', stockCode: '005930' },
      ];
      mockDartService.searchCompanyByName.mockResolvedValue(mockResult);

      const result = await service.search('삼성');

      expect(mockDartService.searchCompanyByName).toHaveBeenCalledWith('삼성');
      expect(result).toEqual(mockResult);
    });
  });

  describe('register', () => {
    it('should create new company if not exists', async () => {
      mockCompanyRepo.findByCorpCode.mockResolvedValue(null);
      mockUserCompanyRepo.findByUserAndCompany.mockResolvedValue(null);

      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
        createdAt: new Date(),
      };

      mockEntityManager.create.mockReturnValueOnce(mockCompany);
      mockEntityManager.create.mockReturnValueOnce({
        userId: 'user123',
        company: mockCompany,
      });

      // Mock collect method to prevent it from running
      jest.spyOn(service, 'collect').mockResolvedValue({
        financial: false,
        stock: false,
        history: false,
      });

      await service.register('user123', '00126380', '삼성전자', '005930');

      expect(mockCompanyRepo.findByCorpCode).toHaveBeenCalledWith('00126380');
      expect(mockCompanyRepo.persist).toHaveBeenCalled();
      expect(mockEntityManager.flush).toHaveBeenCalled();
      expect(service.collect).toHaveBeenCalledWith(1);
    });

    it('should not create company if already exists', async () => {
      const existingCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
        createdAt: new Date(),
      };

      mockCompanyRepo.findByCorpCode.mockResolvedValue(existingCompany);
      mockUserCompanyRepo.findByUserAndCompany.mockResolvedValue(null);

      await service.register('user123', '00126380', '삼성전자', '005930');

      expect(mockCompanyRepo.persist).not.toHaveBeenCalled();
    });

    it('should return early if user-company link already exists', async () => {
      const existingCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
      };

      const existingLink = { userId: 'user123', company: existingCompany };

      mockCompanyRepo.findByCorpCode.mockResolvedValue(existingCompany);
      mockUserCompanyRepo.findByUserAndCompany.mockResolvedValue(existingLink);

      const result = await service.register(
        'user123',
        '00126380',
        '삼성전자',
        '005930',
      );

      expect(result).toEqual(existingCompany);
      expect(mockEntityManager.flush).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all companies for a user', async () => {
      const mockCompany1 = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
      };
      const mockCompany2 = { id: 2, corpCode: '00164779', corpName: '삼성물산' };

      const mockUserCompanies = [
        { userId: 'user123', company: mockCompany1 },
        { userId: 'user123', company: mockCompany2 },
      ];

      mockUserCompanyRepo.findByUserId.mockResolvedValue(mockUserCompanies);

      const result = await service.findAll('user123');

      expect(mockUserCompanyRepo.findByUserId).toHaveBeenCalledWith('user123');
      expect(result).toEqual([mockCompany1, mockCompany2]);
    });
  });

  describe('findOne', () => {
    it('should return company with relations', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        financials: [],
        stockData: [],
      };

      mockCompanyRepo.findByIdWithRelations.mockResolvedValue(mockCompany);

      const result = await service.findOne(1);

      expect(mockCompanyRepo.findByIdWithRelations).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('getQuarterDetail', () => {
    it('should return financial and stock history for a quarter', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
      };

      const mockFinancial = {
        id: 1,
        company: mockCompany,
        year: 2024,
        quarter: 1,
        revenue: '100000',
      };

      const mockStockHistory = [
        { date: new Date(2024, 0, 1), close: 75000 },
        { date: new Date(2024, 0, 2), close: 75500 },
      ];

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue(
        mockFinancial,
      );
      mockStockHistoryRepo.findByCompanyAndDateRange.mockResolvedValue(
        mockStockHistory,
      );

      const result = await service.getQuarterDetail(1, 2024, 1);

      expect(result).toEqual({
        financial: mockFinancial,
        stockHistory: mockStockHistory,
      });
    });

    it('should return empty stock history if no stock code', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: null,
      };

      const mockFinancial = {
        id: 1,
        company: mockCompany,
        year: 2024,
        quarter: 1,
        revenue: '100000',
      };

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue(
        mockFinancial,
      );

      const result = await service.getQuarterDetail(1, 2024, 1);

      expect(result).toEqual({
        financial: mockFinancial,
        stockHistory: [],
      });
      expect(mockStockHistoryRepo.findByCompanyAndDateRange).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user-company link', async () => {
      const mockUserCompany = {
        userId: 'user123',
        company: { id: 1 },
      };

      mockUserCompanyRepo.findByUserAndCompanyId.mockResolvedValue(
        mockUserCompany,
      );

      const result = await service.delete(1, 'user123');

      expect(mockUserCompanyRepo.findByUserAndCompanyId).toHaveBeenCalledWith(
        'user123',
        1,
      );
      expect(mockUserCompanyRepo.removeAndFlush).toHaveBeenCalledWith(
        mockUserCompany,
      );
      expect(result).toEqual({ deleted: true });
    });

    it('should return null if link does not exist', async () => {
      mockUserCompanyRepo.findByUserAndCompanyId.mockResolvedValue(null);

      const result = await service.delete(1, 'user123');

      expect(result).toBeNull();
      expect(mockUserCompanyRepo.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('collect', () => {
    it('should collect financial data', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: null,
      };

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue(null);
      mockDartService.getFinancialStatements.mockResolvedValue([
        {
          account_nm: '매출액',
          fs_div: 'CFS',
          thstrm_amount: '100,000',
        },
        {
          account_nm: '영업이익',
          fs_div: 'CFS',
          thstrm_amount: '20,000',
        },
        {
          account_nm: '당기순이익',
          fs_div: 'CFS',
          thstrm_amount: '15,000',
        },
      ]);

      const result = await service.collect(1);

      expect(result.financial).toBe(true);
      expect(result.stock).toBe(false);
      expect(result.history).toBe(false);
      expect(mockFinancialRepo.persist).toHaveBeenCalled();
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should skip existing financial data', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: null,
      };

      const existingFinancial = { id: 1, year: 2023, quarter: 4 };

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue(
        existingFinancial,
      );

      await service.collect(1);

      expect(mockDartService.getFinancialStatements).not.toHaveBeenCalled();
    });

    it('should collect stock data if stock code exists', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
      };

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue({});
      mockDartService.getFinancialStatements.mockResolvedValue([]);
      mockStockDataRepo.findTodayData.mockResolvedValue(null);
      mockNaverFinanceService.getStockInfo.mockResolvedValue({
        price: 75000,
        per: 15.5,
        pbr: 1.2,
        foreignRatio: 30.5,
      });
      mockNaverFinanceService.getStockHistory.mockResolvedValue([]);
      mockStockHistoryRepo.findByCompanyAndDate.mockResolvedValue(null);

      const result = await service.collect(1);

      expect(result.stock).toBe(true);
      expect(mockNaverFinanceService.getStockInfo).toHaveBeenCalledWith(
        '005930',
      );
      expect(mockStockDataRepo.persistAndFlush).toHaveBeenCalled();
    });

    it('should collect stock history if stock code exists', async () => {
      const mockCompany = {
        id: 1,
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
      };

      const mockHistory = [
        {
          date: new Date(2024, 0, 1),
          close: 75000,
          open: 74500,
          high: 76000,
          low: 74000,
          volume: '1000000',
        },
      ];

      mockCompanyRepo.findOneOrFail.mockResolvedValue(mockCompany);
      mockFinancialRepo.findByCompanyYearQuarter.mockResolvedValue({});
      mockDartService.getFinancialStatements.mockResolvedValue([]);
      mockStockDataRepo.findTodayData.mockResolvedValue({});
      mockNaverFinanceService.getStockHistory.mockResolvedValue(mockHistory);
      mockStockHistoryRepo.findByCompanyAndDate.mockResolvedValue(null);

      const result = await service.collect(1);

      expect(result.history).toBe(true);
      expect(mockNaverFinanceService.getStockHistory).toHaveBeenCalledWith(
        '005930',
        600,
      );
      expect(mockStockHistoryRepo.persist).toHaveBeenCalled();
    });
  });
});
