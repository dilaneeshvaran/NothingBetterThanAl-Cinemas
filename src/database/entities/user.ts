import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name: string;

    @Column()
    password: string; // hashed password

    @Column()
    role: 'admin' | 'client';

    @Column({ type: 'varchar', nullable: true })
    token: string; // authentication token

    @Column()
    balance: number;

    constructor(
        name: string,
        password: string,
        role: 'admin' | 'client',
        token: string,
        balance: number
      ) {
        this.name = name;
        this.password = password;
        this.role = role;
        this.token = token;
        this.balance = balance;
      }
}