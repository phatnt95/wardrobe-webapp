import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { firstValueFrom } from 'rxjs';
import { WeatherResponseDto } from './dto/weather-response.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  // Cache TTL: 30 minutes in milliseconds
  private readonly CACHE_TTL_MS = 30 * 60 * 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.apiKey =
      this.configService.get<string>('OPENWEATHERMAP_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        'OPENWEATHERMAP_API_KEY is not set. Weather fetches will fail.',
      );
    }
  }

  /**
   * Fetch weather for given lat/lon.
   * Results are cached for 30 minutes per coordinate pair.
   */
  async getWeather(lat: number, lon: number): Promise<WeatherResponseDto> {
    const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;

    // Check cache first
    const cached = await this.cacheManager.get<WeatherResponseDto>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    // this.logger.log(
    //   `Cache MISS for key: ${cacheKey}. Fetching from OpenWeatherMap...`,
    // );

    // const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

    // const response = await firstValueFrom(this.httpService.get(url));
    // const data = response.data;

    // this.logger.log(data);

    // // Map only the fields we need — strip everything else
    // const result: WeatherResponseDto = {
    //   temperature: Math.round(data.main.temp),
    //   feelsLike: Math.round(data.main.feels_like),
    //   humidity: data.main.humidity,
    //   iconCode: data.weather[0].icon,
    //   iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    //   condition: data.weather[0].main,
    //   description: data.weather[0].description,
    //   cityName: data.name,
    // };

    // // Store in cache with TTL
    // await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_MS);
    // this.logger.log(`Cached weather for ${result.cityName} (TTL: 30 min)`);

    // return result;
    this.logger.log(
      `Cache MISS for key: ${cacheKey}. Fetching from OpenWeatherMap...`,
    );

    const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

    try {
      // Ép timeout 5 giây để không bị treo server
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 }) 
      );
      const data = response.data;
      
      // Map only the fields we need — strip everything else
      const result: WeatherResponseDto = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        iconCode: data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        cityName: data.name,
      };

      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL_MS);
      this.logger.log(`Cached weather for ${result.cityName} (TTL: 30 min)`);

      return result;

    } catch (error) {
      // In ra lỗi chi tiết để biết tại sao kẹt
      this.logger.error(`Lỗi sập lúc gọi HTTP: ${error.message}`);
      if (error.response) {
        this.logger.error(`Chi tiết từ OpenWeatherMap: ${JSON.stringify(error.response.data)}`);
      }
      
      // Quăng lỗi ra ngoài để request không bị treo vòng vòng
      throw error; 
    }
  }
}
