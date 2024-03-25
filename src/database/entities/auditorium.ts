import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Image } from "./image";


@Entity()
export class Auditorium {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  //@OneToMany(() => Image, (image) => image.auditorium)
  @Column()
  imageUrl: string;

  @Column()
  type: string;

  @Column()
  capacity: number;

  @Column({ nullable: true })
  handicapAccessible: boolean;

  constructor(
    id:number,
    name: string,
    description: string,
    imageUrl: string,
    type: string,
    capacity: number,
    handicapAccessible: boolean,
  ) {
    this.id=id;
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.type = type;
    this.capacity = capacity;
    this.handicapAccessible = handicapAccessible;
  }
}