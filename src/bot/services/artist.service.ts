import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../entities/artist.entity';

@Injectable()
export class ArtistService {
  constructor(
    @InjectRepository(Artist)
    private artistRepository: Repository<Artist>,
  ) {}

  async findOne(name: string) {
    try {
      return await this.artistRepository.findOne({
        where: { name: name },
      });
    } catch (e) {
      throw new Error(e);
    }
  }
}
