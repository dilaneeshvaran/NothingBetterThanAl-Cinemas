import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Auditorium } from "./auditorium";
import { Schedule } from "./schedule";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Schedule, (schedule) => schedule.tickets)
    schedule: Schedule;

    @Column()
    price:number;

  constructor(
    id:number,
    schedule: Schedule,
    price:number
  ) {
    this.id=id;
    this.schedule = schedule;
    this.price=price;
  }
}