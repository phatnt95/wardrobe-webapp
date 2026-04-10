import { Module } from '@nestjs/common';
import { ChromaService } from './chroma.service';
import { GeminiService } from './gemini.service';

@Module({
  providers: [ChromaService, GeminiService],
  exports: [ChromaService, GeminiService],
})
export class ChromaModule {}
