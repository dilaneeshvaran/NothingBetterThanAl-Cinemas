import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Auditorium {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  seats: number;

  constructor(
    id: number,
    seats: number,
  ) {
    this.id = id;
    this.seats = seats;
  }
}
