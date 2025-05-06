import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
