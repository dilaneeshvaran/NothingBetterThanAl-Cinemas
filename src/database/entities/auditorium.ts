import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Min, Max } from "class-validator";
import { Image } from "./image";


@Entity()
export class Auditorium {
  @PrimaryGeneratedColumn()
  id!: number;

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
  @Min(15)
  @Max(30)
  capacity: number;

  @Column({ type: "boolean", default: false })
  maintenance: boolean;

  @Column({ nullable: true })
  handicapAccessible: boolean;

  constructor(
    name: string,
    description: string,
    imageUrl: string,
    type: string,
    capacity: number,
    handicapAccessible: boolean,
    maintenance: boolean,
  ) {
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.type = type;
    this.capacity = capacity;
    this.handicapAccessible = handicapAccessible;
    this.maintenance=maintenance;
  }
}