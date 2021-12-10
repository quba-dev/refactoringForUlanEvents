import {forwardRef, HttpCode, HttpException, HttpStatus, Inject, Injectable} from '@nestjs/common';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import {InjectRepository} from "@nestjs/typeorm";
import {Location} from "./entities/location.entity";
import {Repository, In} from "typeorm";

import {Context} from "@nestjs/graphql";
import {Account} from "../accounts/entities/account.entity";
import {AccountsService} from "../accounts/accounts.service";
import {JwtService} from "@nestjs/jwt";
import {constants} from "http2";
import {Activity} from "../activities/entities/activity.entity";
import {dayInput} from "./dto/day.input";
import {ActivitiesService} from "../activities/activities.service";





@Injectable()
export class LocationsService {
  constructor(
      @InjectRepository(Location)
      private readonly locationService: Repository<Location>,
      private readonly jwtService: JwtService) {
  }

  async createLocation(dto: CreateLocationInput, token) {
    const location = new Location()
    const currentUser = this.jwtService.verify(token)

    Object.assign(location, dto)
    location.account=currentUser
    return this.locationService.save(location)
  }

  async update(dto: UpdateLocationInput,currentUser) {
    const location = await this.locationService.findOne(dto.id)

    const user = this.jwtService.verify(currentUser)
    if (!location) {
      throw new HttpException('Location does not exist', HttpStatus.NOT_FOUND)
    }

    if(location.account.email!==user.email){
      throw new HttpException('You are not author', HttpStatus.FORBIDDEN)
    }
    Object.assign(location, dto)
    return this.locationService.save(location)
  }



  async remove(id: number, currentUser) {
    const location = await this.locationService.findOne(id)
    const user = this.jwtService.verify(currentUser)

    if (!location) {
      throw new HttpException('location does not exist', HttpStatus.NOT_FOUND)
    }
    if(location.account.email!==user.email){
      throw new HttpException('You are not author', HttpStatus.FORBIDDEN)

    }

    await this.locationService.delete(id)
    return location
  }

  async findById(id){
    return this.locationService.findOne(id)
  }
  async find(ids) {
    return this.locationService.find({
      where: {id: In(ids)}
    })
  }

  async hola(ids){
    return this.locationService.find()
  }

  async findByLocationAndTime(id: number, day:Date) {
    const locationById = await this.locationService.findOne(id, {relations: ["activities"]})
    if (!locationById) {
      throw new HttpException('there is no such location', HttpStatus.NOT_FOUND)
    }
    const currentActivity = locationById.activities

    let data = []
    for (let x of currentActivity){
      data.push((x.day).toLocaleDateString())
    }

    for (let x of data ){
      if ((day.toLocaleDateString()).toString() == x){
        throw new HttpException('на этот день занято', HttpStatus.NOT_FOUND)
      }
    }
    return new HttpException('Created', HttpStatus.OK)
  }

  async findAll(){
    return this.locationService.find()
  }
}
