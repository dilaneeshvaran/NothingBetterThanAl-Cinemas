import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum TicketType {
  NORMAL = 'normal',
  SUPER = 'super'
}

@Entity()
export class Ticket {

    @Column({ default: 10, nullable: true })
  remainingUses?: number;

  @Column("simple-array", { nullable: true })
  usedSchedules?: number[];

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 15 })
  price: number;

  @Column({ type: 'int', nullable: true })
  scheduleId: number;

  @Column({
    type: "enum",
    enum: TicketType,
    default: TicketType.NORMAL
  })
  type: TicketType;

  constructor(
    price: number = 15,
    scheduleId: number,
    type: TicketType = TicketType.NORMAL,
    remainingUses: number = 10,
    usedSchedules: number[] = []
  ) {
    this.price = price;
    this.scheduleId = scheduleId;
    this.type = type;
    if (this.type === TicketType.SUPER) {
      this.remainingUses = remainingUses;
      this.usedSchedules = usedSchedules;
    } else {
      this.remainingUses = 1;
      this.usedSchedules = undefined;
    }
  }
}