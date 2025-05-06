import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

describe('ConfigModule', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should validate environment variables', () => {
    expect(configService).toBeDefined();
  });
});