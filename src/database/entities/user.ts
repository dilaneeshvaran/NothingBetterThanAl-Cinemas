import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string; // hashed password

    @Column()
    role: 'admin' | 'client';

    @Column({default:0})
    balance: number;

    constructor(
        name: string,
        email: string,
        password: string,
        role: 'admin' | 'client',
        balance: number
      ) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.balance = balance;
      }
}