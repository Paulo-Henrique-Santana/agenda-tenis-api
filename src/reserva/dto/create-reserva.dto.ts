export interface SlotDto {
  date: string;
  timeSlot: string;
}

export interface CreateReservaDto {
  name: string;
  cpf: string;
  slots: SlotDto[];
}
