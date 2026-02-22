import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface StockInfo {
  price: number | null;
  per: number | null;
  pbr: number | null;
  foreignRatio: number | null;
}

@Injectable()
export class NaverFinanceService {
  private readonly baseUrl = 'https://finance.naver.com/item/main.naver';

  async getStockInfo(stockCode: string): Promise<StockInfo> {
    const response = await axios.get(this.baseUrl, {
      params: { code: stockCode },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    const price = this.parsePrice($);
    const per = this.parsePER($);
    const pbr = this.parsePBR($);
    const foreignRatio = this.parseForeignRatio($);

    return { price, per, pbr, foreignRatio };
  }

  private parsePrice($: ReturnType<typeof cheerio.load>): number | null {
    const priceText = $('p.no_today .blind').first().text();
    const price = parseInt(priceText.replace(/,/g, ''), 10);
    return isNaN(price) ? null : price;
  }

  private parsePER($: ReturnType<typeof cheerio.load>): number | null {
    const perText = $('#_per').text();
    const per = parseFloat(perText.replace(/,/g, ''));
    return isNaN(per) ? null : per;
  }

  private parsePBR($: ReturnType<typeof cheerio.load>): number | null {
    const pbrText = $('#_pbr').text();
    const pbr = parseFloat(pbrText.replace(/,/g, ''));
    return isNaN(pbr) ? null : pbr;
  }

  private parseForeignRatio($: ReturnType<typeof cheerio.load>): number | null {
    const table = $('table.lwidth').first();
    const rows = table.find('tr');
    let foreignRatio: number | null = null;

    rows.each((_, row) => {
      const th = $(row).find('th').text();
      if (th.includes('외국인소진율')) {
        const td = $(row).find('td').text();
        const ratio = parseFloat(td.replace(/%/g, '').trim());
        if (!isNaN(ratio)) {
          foreignRatio = ratio;
        }
      }
    });

    return foreignRatio;
  }
}
