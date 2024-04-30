import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,JoinColumn } from "typeorm";
import { Schedule } from "./schedule";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: Date;

  @Column()
  amount!: number;

  @Column()
  description!: string;

  @Column()
  scheduleId!: number;

  constructor(
    date: Date,
    amount: number,
    description: string,
    scheduleId: number
  ) {
    this.date = date;
    this.amount = amount;
    this.description = description;
    this.scheduleId = scheduleId;
  }

}