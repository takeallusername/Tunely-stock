import { Test, TestingModule } from '@nestjs/testing';
import { NaverFinanceService } from './naver-finance.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NaverFinanceService', () => {
  let service: NaverFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NaverFinanceService],
    }).compile();

    service = module.get<NaverFinanceService>(NaverFinanceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockInfo', () => {
    it('should return stock info with all fields', async () => {
      const mockHtml = `
        <html>
          <body>
            <p class="no_today"><span class="blind">75,000</span></p>
            <div id="_per">15.5</div>
            <div id="_pbr">1.2</div>
            <table class="lwidth">
              <tr>
                <th>외국인소진율</th>
                <td>30.5%</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.getStockInfo('005930');

      expect(result).toEqual({
        price: 75000,
        per: 15.5,
        pbr: 1.2,
        foreignRatio: 30.5,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://finance.naver.com/item/main.naver',
        expect.objectContaining({
          params: { code: '005930' },
        }),
      );
    });

    it('should return null for missing fields', async () => {
      const mockHtml = `
        <html>
          <body>
            <p class="no_today"><span class="blind">N/A</span></p>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.getStockInfo('000000');

      expect(result).toEqual({
        price: null,
        per: null,
        pbr: null,
        foreignRatio: null,
      });
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getStockInfo('005930')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getStockHistory', () => {
    it('should return stock history data sorted by date', async () => {
      const mockHtml = `
        <html>
          <body>
            <table class="type2">
              <tr>
                <td>2024.01.02</td>
                <td>75,000</td>
                <td></td>
                <td>74,500</td>
                <td>76,000</td>
                <td>74,000</td>
                <td>1,000,000</td>
              </tr>
              <tr>
                <td>2024.01.01</td>
                <td>74,500</td>
                <td></td>
                <td>74,000</td>
                <td>75,500</td>
                <td>73,500</td>
                <td>900,000</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const result = await service.getStockHistory('005930', 1);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: new Date(2024, 0, 1),
        close: 74500,
        open: 74000,
        high: 75500,
        low: 73500,
        volume: '900000',
      });
      expect(result[1]).toEqual({
        date: new Date(2024, 0, 2),
        close: 75000,
        open: 74500,
        high: 76000,
        low: 74000,
        volume: '1000000',
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fetch multiple pages', async () => {
      const mockHtml = `
        <html>
          <body>
            <table class="type2">
              <tr>
                <td>2024.01.01</td>
                <td>75,000</td>
                <td></td>
                <td>74,500</td>
                <td>76,000</td>
                <td>74,000</td>
                <td>1,000,000</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const result = await service.getStockHistory('005930', 3);

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should skip invalid rows', async () => {
      const mockHtml = `
        <html>
          <body>
            <table class="type2">
              <tr>
                <td>Invalid Date</td>
                <td>75,000</td>
              </tr>
              <tr>
                <td>2024.01.01</td>
                <td>N/A</td>
                <td></td>
                <td>74,500</td>
                <td>76,000</td>
                <td>74,000</td>
                <td>1,000,000</td>
              </tr>
              <tr>
                <td colspan="7">Summary</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const result = await service.getStockHistory('005930', 1);

      expect(result).toHaveLength(0);
    });
  });
});
