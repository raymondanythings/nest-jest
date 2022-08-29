import { Module } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { EpisodeResolver, PodcastsResolver } from './podcasts.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Podcast } from './entities/podcast.entity';
import { Episode } from './entities/episode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Podcast, Episode])],
  providers: [PodcastsService, PodcastsResolver, EpisodeResolver],
})
export class PodcastsModule {}
