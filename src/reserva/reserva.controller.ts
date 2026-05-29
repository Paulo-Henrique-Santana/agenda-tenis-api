import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { CreateReservaDto } from './dto/create-reserva.dto';
import { ReservaService } from './reserva.service';

@Controller('reservas')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  @Get('email-logs')
  async findEmailLogs() {
    return this.reservaService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Body() dto: CreateReservaDto): Promise<void> {
    await this.reservaService.enviar(dto);
  }
}
