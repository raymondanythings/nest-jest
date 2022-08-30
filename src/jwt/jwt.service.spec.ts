import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';
const TEST_KEY = '123';
const PAYLOAD = {
  id: 1,
};
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => PAYLOAD),
  };
});
describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            privateKey: TEST_KEY,
          },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('sign', () => {
    it('should return a signed token', async () => {
      const token = service.sign(PAYLOAD.id);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(PAYLOAD, TEST_KEY);
    });
  });
  describe('verify', () => {
    it('should return the decoded token', async () => {
      const TOKEN = 'TOKEN';
      const decodedToken = service.verify(TOKEN);
      expect(decodedToken).toEqual(PAYLOAD);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
    });
  });
});
