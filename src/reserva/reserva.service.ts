import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CreateReservaDto } from './dto/create-reserva.dto';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

@Injectable()
export class ReservaService {
  private readonly logger = new Logger(ReservaService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async enviar(dto: CreateReservaDto): Promise<void> {
    const emailBody = this.buildEmailBody(dto);
    const recipient = this.config.getOrThrow<string>('RECIPIENT_EMAIL');
    const senderName = this.config.get<string>('SENDER_NAME', 'Agenda Tênis');
    const senderEmail = this.config.getOrThrow<string>('SENDER_EMAIL');

    try {
      await this.transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipient,
        subject: 'Reserva de Quadra de Tênis',
        text: emailBody,
      });

      this.logger.log(
        `Reserva enviada para ${recipient} (solicitante: ${dto.name})`,
      );
    } catch (error) {
      this.logger.error('Falha ao enviar e-mail de reserva', error);
      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de reserva.',
      );
    }
  }

  private buildEmailBody(dto: CreateReservaDto): string {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = dto.name.trim().split(' ')[0];

    const formatSlot = (date: Date, timeSlot: string): string => {
      const weekday = WEEKDAYS[date.getDay()];
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${weekday}, dia ${day}/${month} às ${timeSlot}`;
    };

    const parsedSlots = dto.slots.map((s) => ({
      date: new Date(s.date),
      timeSlot: s.timeSlot,
    }));

    if (parsedSlots.length === 1) {
      const { date, timeSlot } = parsedSlots[0];
      return (
        `${greeting}!\n\n` +
        `Meu nome é ${dto.name} com o CPF ${dto.cpf} e gostaria de reservar a quadra de tênis sintética ` +
        `para essa ${formatSlot(date, timeSlot)}.\n\n` +
        `Att,\n${firstName}`
      );
    }

    const slotLines = parsedSlots
      .map((s) => `- ${formatSlot(s.date, s.timeSlot)}`)
      .join('\n');
    return (
      `${greeting}!\n\n` +
      `Meu nome é ${dto.name} com o CPF ${dto.cpf} e gostaria de reservar a quadra de tênis sintética ` +
      `nas seguintes datas:\n${slotLines}\n\n` +
      `Att,\n${firstName}`
    );
  }
}
