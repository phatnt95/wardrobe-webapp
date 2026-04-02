import { Test, TestingModule } from '@nestjs/testing';
import { ChromaService } from './chroma.service';

describe('ChromaService', () => {
  let service: ChromaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChromaService],
    }).compile();

    service = module.get<ChromaService>(ChromaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
