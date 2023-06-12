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

  async create(artistTemplate: Artist) {
    try {
      const artist = await this.artistRepository.create(artistTemplate);
      return await this.artistRepository.save(artist);
    } catch (e) {
      throw new Error(e);
    }
  }

  async update(artistId: number, artistTemplate: Artist) {
    try {
      return await this.artistRepository.update(artistId, artistTemplate);
    } catch (e) {
      throw new Error(e);
    }
  }

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
