import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface StockInfo {
  price: number | null;
  per: number | null;
  pbr: number | null;
  foreignRatio: number | null;
}

export interface StockHistoryItem {
  date: Date;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: string;
}

@Injectable()
export class NaverFinanceService {
  private readonly baseUrl = 'https://finance.naver.com/item/main.naver';
  private readonly historyUrl = 'https://finance.naver.com/item/sise_day.naver';

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

  async getStockHistory(stockCode: string, pages: number = 5): Promise<StockHistoryItem[]> {
    const results: StockHistoryItem[] = [];
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    for (let page = 1; page <= pages; page++) {
      const response = await axios.get(this.historyUrl, {
        params: { code: stockCode, page },
        headers,
      });

      const $ = cheerio.load(response.data);
      const rows = $('table.type2 tr');

      rows.each((_, row) => {
        const tds = $(row).find('td');
        if (tds.length < 7) return;

        const dateText = $(tds[0]).text().trim();
        if (!dateText || !dateText.match(/\d{4}\.\d{2}\.\d{2}/)) return;

        const [year, month, day] = dateText.split('.').map(Number);
        const date = new Date(year, month - 1, day);

        const close = parseInt($(tds[1]).text().replace(/,/g, ''), 10);
        const open = parseInt($(tds[3]).text().replace(/,/g, ''), 10);
        const high = parseInt($(tds[4]).text().replace(/,/g, ''), 10);
        const low = parseInt($(tds[5]).text().replace(/,/g, ''), 10);
        const volume = $(tds[6]).text().replace(/,/g, '').trim();

        if (!isNaN(close) && !isNaN(open) && !isNaN(high) && !isNaN(low)) {
          results.push({ date, close, open, high, low, volume });
        }
      });
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
