import {
  Controller,
  Get,
  Query,
  BadRequestException,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { WeatherResponseDto } from './dto/weather-response.dto';

@ApiTags('Weather')
@ApiBearerAuth()
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current weather by coordinates',
    description:
      'Fetches current weather data from OpenWeatherMap. Results are cached for 30 minutes per coordinate.',
  })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude', example: 10.8231 })
  @ApiQuery({ name: 'lon', type: Number, description: 'Longitude', example: 106.6297 })
  @ApiResponse({
    status: 200,
    description: 'Weather data successfully retrieved (from cache or live)',
    type: WeatherResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid lat/lon parameters' })
  async getWeather(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
  ): Promise<WeatherResponseDto> {
    if (isNaN(lat) || isNaN(lon)) {
      throw new BadRequestException('lat and lon query parameters are required and must be valid numbers.');
    }
    return this.weatherService.getWeather(lat, lon);
  }
}
