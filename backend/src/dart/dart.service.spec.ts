import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DartService } from './dart.service';
import axios from 'axios';
import AdmZip from 'adm-zip';

jest.mock('axios');
jest.mock('adm-zip');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

describe('DartService', () => {
  let service: DartService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DartService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<DartService>(DartService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanyInfo', () => {
    it('should return company info when status is 000', async () => {
      const mockResponse = {
        data: {
          status: '000',
          corp_code: '00126380',
          corp_name: '삼성전자',
          stock_code: '005930',
          modify_date: '20240101',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getCompanyInfo('00126380');

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://opendart.fss.or.kr/api/company.json',
        {
          params: {
            crtfc_key: 'test-api-key',
            corp_code: '00126380',
          },
        },
      );
    });

    it('should return null when status is not 000', async () => {
      const mockResponse = {
        data: {
          status: '013',
          message: '조회된 데이터가 없습니다',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getCompanyInfo('invalid');

      expect(result).toBeNull();
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getCompanyInfo('00126380')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getFinancialStatements', () => {
    it('should return financial data when status is 000', async () => {
      const mockResponse = {
        data: {
          status: '000',
          list: [
            {
              rcept_no: '20231101000001',
              bsns_year: '2023',
              corp_code: '00126380',
              stock_code: '005930',
              reprt_code: '11011',
              account_nm: '매출액',
              fs_div: 'CFS',
              fs_nm: '연결재무제표',
              sj_div: 'IS',
              sj_nm: '손익계산서',
              thstrm_nm: '제53기',
              thstrm_amount: '302,231,063',
              frmtrm_nm: '제52기',
              frmtrm_amount: '279,608,141',
              bfefrmtrm_nm: '제51기',
              bfefrmtrm_amount: '244,187,858',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getFinancialStatements('00126380', '2023');

      expect(result).toEqual(mockResponse.data.list);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://opendart.fss.or.kr/api/fnlttSinglAcnt.json',
        {
          params: {
            crtfc_key: 'test-api-key',
            corp_code: '00126380',
            bsns_year: '2023',
            reprt_code: '11011',
          },
        },
      );
    });

    it('should use default reportCode if not provided', async () => {
      const mockResponse = {
        data: {
          status: '000',
          list: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await service.getFinancialStatements('00126380', '2023');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            reprt_code: '11011',
          }),
        }),
      );
    });

    it('should return empty array when status is not 000', async () => {
      const mockResponse = {
        data: {
          status: '013',
          message: '조회된 데이터가 없습니다',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getFinancialStatements('invalid', '2023');

      expect(result).toEqual([]);
    });

    it('should return empty array when list is undefined', async () => {
      const mockResponse = {
        data: {
          status: '000',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getFinancialStatements('00126380', '2023');

      expect(result).toEqual([]);
    });
  });

  describe('searchCompanyByName', () => {
    it('should return filtered companies with stock codes', async () => {
      const mockXmlContent = `
        <?xml version="1.0" encoding="UTF-8"?>
        <result>
          <list>
            <corp_code>00126380</corp_code>
            <corp_name>삼성전자</corp_name>
            <stock_code>005930</stock_code>
            <modify_date>20240101</modify_date>
          </list>
          <list>
            <corp_code>00164779</corp_code>
            <corp_name>삼성물산</corp_name>
            <stock_code>028260</stock_code>
            <modify_date>20240101</modify_date>
          </list>
          <list>
            <corp_code>00000001</corp_code>
            <corp_name>삼성비상장</corp_name>
            <stock_code></stock_code>
            <modify_date>20240101</modify_date>
          </list>
        </result>
      `;

      const mockZipInstance = {
        readAsText: jest.fn().mockReturnValue(mockXmlContent),
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('mock-zip-data'),
      });

      MockedAdmZip.mockImplementation(() => mockZipInstance as any);

      const result = await service.searchCompanyByName('삼성');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        corpCode: '00126380',
        corpName: '삼성전자',
        stockCode: '005930',
        modifyDate: '20240101',
      });
      expect(result[1]).toEqual({
        corpCode: '00164779',
        corpName: '삼성물산',
        stockCode: '028260',
        modifyDate: '20240101',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://opendart.fss.or.kr/api/corpCode.xml',
        {
          params: { crtfc_key: 'test-api-key' },
          responseType: 'arraybuffer',
        },
      );
    });

    it('should limit results to 20', async () => {
      const mockList = Array.from({ length: 30 }, (_, i) => ({
        corp_code: [`0012638${i}`],
        corp_name: [`삼성${i}`],
        stock_code: [`00593${i}`],
        modify_date: ['20240101'],
      }));

      const mockXmlContent = `
        <?xml version="1.0" encoding="UTF-8"?>
        <result>
          ${mockList.map(() => `<list><corp_code>test</corp_code><corp_name>삼성</corp_name><stock_code>123456</stock_code><modify_date>20240101</modify_date></list>`).join('')}
        </result>
      `;

      const mockZipInstance = {
        readAsText: jest.fn().mockReturnValue(mockXmlContent),
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('mock-zip-data'),
      });

      MockedAdmZip.mockImplementation(() => mockZipInstance as any);

      const result = await service.searchCompanyByName('삼성');

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should filter out companies without stock code', async () => {
      const mockXmlContent = `
        <?xml version="1.0" encoding="UTF-8"?>
        <result>
          <list>
            <corp_code>00000001</corp_code>
            <corp_name>테스트</corp_name>
            <stock_code></stock_code>
            <modify_date>20240101</modify_date>
          </list>
          <list>
            <corp_code>00000002</corp_code>
            <corp_name>테스트2</corp_name>
            <stock_code>   </stock_code>
            <modify_date>20240101</modify_date>
          </list>
        </result>
      `;

      const mockZipInstance = {
        readAsText: jest.fn().mockReturnValue(mockXmlContent),
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('mock-zip-data'),
      });

      MockedAdmZip.mockImplementation(() => mockZipInstance as any);

      const result = await service.searchCompanyByName('테스트');

      expect(result).toHaveLength(0);
    });
  });
});
