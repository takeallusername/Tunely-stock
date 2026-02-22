import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

interface CorpInfo {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
}

interface FinancialData {
  rcept_no: string;
  bsns_year: string;
  corp_code: string;
  stock_code: string;
  reprt_code: string;
  account_nm: string;
  fs_div: string;
  fs_nm: string;
  sj_div: string;
  sj_nm: string;
  thstrm_nm: string;
  thstrm_amount: string;
  frmtrm_nm: string;
  frmtrm_amount: string;
  bfefrmtrm_nm: string;
  bfefrmtrm_amount: string;
}

@Injectable()
export class DartService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://opendart.fss.or.kr/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DART_API_KEY')!;
  }

  async getCompanyInfo(corpCode: string): Promise<CorpInfo | null> {
    const response = await axios.get(`${this.baseUrl}/company.json`, {
      params: {
        crtfc_key: this.apiKey,
        corp_code: corpCode,
      },
    });

    if (response.data.status !== '000') {
      return null;
    }

    return response.data;
  }

  async getFinancialStatements(
    corpCode: string,
    year: string,
    reportCode: string = '11011',
  ): Promise<FinancialData[]> {
    const response = await axios.get(`${this.baseUrl}/fnlttSinglAcnt.json`, {
      params: {
        crtfc_key: this.apiKey,
        corp_code: corpCode,
        bsns_year: year,
        reprt_code: reportCode,
      },
    });

    if (response.data.status !== '000') {
      return [];
    }

    return response.data.list || [];
  }

  async searchCompanyByName(name: string): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/corpCode.xml`, {
      params: { crtfc_key: this.apiKey },
      responseType: 'arraybuffer',
    });

    const zip = new AdmZip(response.data);
    const xmlContent = zip.readAsText('CORPCODE.xml');

    const result = await parseStringPromise(xmlContent);

    const companies = result.result.list || [];
    const filtered = companies.filter((item: any) => {
      const corpName = item.corp_name?.[0] || '';
      return corpName.includes(name);
    });

    return filtered.slice(0, 20).map((item: any) => ({
      corpCode: item.corp_code?.[0] || '',
      corpName: item.corp_name?.[0] || '',
      stockCode: item.stock_code?.[0]?.trim() || null,
      modifyDate: item.modify_date?.[0] || '',
    }));
  }
}
