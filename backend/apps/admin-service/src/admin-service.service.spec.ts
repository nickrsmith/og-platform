import { Test, TestingModule } from '@nestjs/testing';
import { AdminServiceService } from './admin-service.service';

describe('AdminServiceService', () => {
  let service: AdminServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminServiceService],
    }).compile();

    service = module.get<AdminServiceService>(AdminServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      // Act
      const result = service.getHello();

      // Assert
      expect(result).toBe('Hello World!');
    });
  });
});
