import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: '00126380', description: 'DART 기업코드' })
  corpCode: string;

  @ApiProperty({ example: '삼성전자', description: '기업명' })
  corpName: string;

  @ApiProperty({ example: '005930', description: '종목코드', required: false })
  stockCode?: string;
}
