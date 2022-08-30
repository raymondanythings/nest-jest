import { Episode } from './entities/episode.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Podcast } from './entities/podcast.entity';
import { PodcastsService } from './podcasts.service';
import { Repository } from 'typeorm';
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
});
const internalServerErrorOutput = {
  ok: false,
  error: 'Internal server error occurred.',
};
const mockEpisode = {
  title: 'category',
  category: 'category',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockPodcast: Podcast = {
  id: 1,
  title: 'title',
  category: '123',
  rating: 4,
  episodes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockId = { id: 1 };
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
describe('PodcastService', () => {
  let service: PodcastsService;
  let podcastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PodcastsService,
        {
          provide: getRepositoryToken(Podcast),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Episode),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<PodcastsService>(PodcastsService);
    podcastRepository = module.get(getRepositoryToken(Podcast));
    episodeRepository = module.get(getRepositoryToken(Episode));
  });

  it('should be define', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPodcasts', () => {
    const podcasts = [{ id: 1 }, { id: 2 }];
    it('should get podcasts', async () => {
      podcastRepository.find.mockResolvedValue(podcasts);
      const result = await service.getAllPodcasts();

      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(podcastRepository.find).toHaveBeenCalledWith();

      expect(result).toEqual({ ok: true, podcasts });
    });

    it('should fail on InternalServerError', async () => {
      podcastRepository.find.mockRejectedValue(new Error());
      const result = await service.getAllPodcasts();

      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(podcastRepository.find).toHaveBeenCalledWith();

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('createPodcast', () => {
    it('should create a podcast', async () => {
      podcastRepository.create.mockReturnValueOnce(mockPodcast);
      podcastRepository.save.mockResolvedValue(mockId);
      const result = await service.createPodcast(mockPodcast);

      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith({
        title: mockPodcast.title,
        category: mockPodcast.category,
      });

      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(mockPodcast);

      expect(result).toEqual({ ok: true, id: mockId.id });
    });

    it('should fail on InternalServerError', async () => {
      podcastRepository.save.mockRejectedValue(new Error());

      const result = await service.createPodcast(mockPodcast);

      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith({
        title: mockPodcast.title,
        category: mockPodcast.category,
      });

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('getPodcast', () => {
    it('should get podcast', async () => {
      podcastRepository.findOne.mockResolvedValue(mockPodcast);
      const result = await service.getPodcast(mockId.id);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        {
          id: mockId.id,
        },
        expect.any(Object),
      );

      expect(result).toEqual({ ok: true, podcast: mockPodcast });
    });

    it('should not found podcast', async () => {
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.getPodcast(mockId.id);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        {
          id: mockId.id,
        },
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${mockId.id} not found`,
      });
    });

    it('should fall on internalServerError', async () => {
      podcastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.getPodcast(mockId.id);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        {
          id: mockId.id,
        },
        expect.any(Object),
      );
      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('deletePodcast', () => {
    it('should delete podcast', async () => {
      jest
        .spyOn(service, 'getPodcast')
        .mockImplementation(async () => ({ ok: true }));
      const result = await service.deletePodcast(mockId.id);

      expect(podcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(podcastRepository.delete).toHaveBeenCalledWith({ id: mockId.id });

      expect(result).toEqual({ ok: true });
    });
  });

  it('should not found podcast', async () => {
    jest
      .spyOn(service, 'getPodcast')
      .mockImplementation(async () => ({ ok: false, error: 'not found' }));
    const result = await service.deletePodcast(mockId.id);

    expect(podcastRepository.delete).toHaveBeenCalledTimes(0);

    expect(result).toEqual({ ok: false, error: 'not found' });
  });

  it('should fail on internal server error', async () => {
    jest.spyOn(service, 'getPodcast').mockRejectedValueOnce(new Error());
    const result = await service.deletePodcast(mockId.id);

    expect(podcastRepository.delete).toHaveBeenCalledTimes(0);

    expect(result).toEqual(internalServerErrorOutput);
  });

  describe('updatePodcast', () => {
    const defaultPayload: Partial<Podcast> = {
      title: 'title',
      category: 'category',
      rating: 3,
    };
    const podcast = {
      ...mockPodcast,
      id: 1,
      rating: 4,
      episodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    it('should update podcast', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementation(async () => ({
        ok: true,
        podcast,
      }));
      const result = await service.updatePodcast({
        id: mockId.id,
        payload: defaultPayload,
      });

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(mockId.id);

      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith({
        ...podcast,
        ...defaultPayload,
      });

      expect(result).toEqual({ ok: true });
    });

    it('should not found podcast', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementation(async () => ({
        ok: false,
        error: 'not found',
        podcast,
      }));
      const result = await service.updatePodcast({
        id: mockId.id,
        payload: defaultPayload,
      });

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({ ok: false, error: 'not found' });
    });

    it('should not update cause rating is over', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementation(async () => ({
        ok: true,
        podcast,
      }));
      const result = await service.updatePodcast({
        id: mockId.id,
        payload: { ...defaultPayload, rating: 6 },
      });

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({
        ok: false,
        error: 'Rating must be between 1 and 5.',
      });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.updatePodcast({
        id: mockId.id,
        payload: { ...defaultPayload, rating: 6 },
      });

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('getepisodes', () => {
    const fakePodcast = {
      ...mockPodcast,
      episodes: [
        { ...mockEpisode, podcast: mockPodcast, id: 1 },
        { ...mockEpisode, podcast: mockPodcast, id: 2 },
      ],
    };
    it('should get episodes', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: fakePodcast,
      });

      const result = await service.getEpisodes(mockId.id);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({ ok: true, episodes: fakePodcast.episodes });
    });
    it('should get episodes', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: false,
        error: 'not found',
      });

      const result = await service.getEpisodes(mockId.id);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({ ok: false, error: 'not found' });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.getEpisodes(mockId.id);

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('getEpisode', () => {
    const oneEpisode = { ...mockEpisode, podcast: mockPodcast, id: 1 };
    const episodes = [oneEpisode, oneEpisode];
    it('should get episode from podcast', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        episodes,
      });

      const result = await service.getEpisode({
        podcastId: mockId.id,
        episodeId: mockId.id,
      });

      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({ ok: true, episode: oneEpisode });
    });
    it('should not found episode', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: false,
        error: 'not found',
      });

      const result = await service.getEpisode({
        podcastId: mockId.id,
        episodeId: mockId.id,
      });

      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({
        ok: false,
        error: 'not found',
      });
    });

    it('should not exist episode from podcast', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        episodes,
      });

      const result = await service.getEpisode({
        podcastId: mockId.id,
        episodeId: 2,
      });

      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(mockId.id);

      expect(result).toEqual({
        ok: false,
        error: `Episode with id 2 not found in podcast with id 1`,
      });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getEpisodes').mockRejectedValue(new Error());
      const result = await service.getEpisode({
        podcastId: mockId.id,
        episodeId: 2,
      });

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('createEpisode', () => {
    const param = {
      podcastId: mockId.id,
      title: 'title',
      category: 'category',
    };

    it('should create episode', async () => {
      jest
        .spyOn(service, 'getPodcast')
        .mockResolvedValue({ ok: true, podcast: mockPodcast });

      episodeRepository.create.mockReturnValue(mockEpisode);
      episodeRepository.save.mockResolvedValue({ id: 1 });
      const result = await service.createEpisode(param);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(param.podcastId);

      expect(episodeRepository.create).toHaveBeenCalledTimes(1);
      expect(episodeRepository.create).toHaveBeenCalledWith({
        title: param.title,
        category: param.category,
      });

      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith({
        ...mockEpisode,
        podcast: mockPodcast,
      });

      expect(result).toEqual({ ok: true, id: mockId.id });
    });

    it('should not found podcast', async () => {
      jest
        .spyOn(service, 'getPodcast')
        .mockResolvedValue({ ok: false, error: 'not found' });

      const result = await service.createEpisode(param);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(param.podcastId);

      expect(result).toEqual({ ok: false, error: 'not found' });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());

      const result = await service.createEpisode(param);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(param.podcastId);

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('deleteEpisode', () => {
    const param = {
      podcastId: mockId.id,
      episodeId: mockId.id,
    };

    const episode = {
      ...mockEpisode,
      podcast: mockPodcast,
      id: 1,
    };

    it('should delete episode', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        episode,
      });

      episodeRepository.create.mockReturnValue(mockEpisode);
      episodeRepository.save.mockResolvedValue({ id: 1 });
      const result = await service.deleteEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(param);

      expect(episodeRepository.delete).toHaveBeenCalledTimes(1);
      expect(episodeRepository.delete).toHaveBeenCalledWith({ id: episode.id });

      expect(result).toEqual({ ok: true });
    });

    it('should not found episode', async () => {
      jest
        .spyOn(service, 'getEpisode')
        .mockResolvedValue({ ok: false, error: 'not found' });

      const result = await service.deleteEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(param);

      expect(result).toEqual({ ok: false, error: 'not found' });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error());

      const result = await service.deleteEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(param);

      expect(result).toEqual(internalServerErrorOutput);
    });
  });

  describe('updateEpisode', () => {
    const param = {
      podcastId: mockId.id,
      episodeId: mockId.id,
      title: 'change',
    };

    const episode = {
      ...mockEpisode,
      podcast: mockPodcast,
      id: 1,
    };

    const getEpisodeParam = {
      podcastId: param.podcastId,
      episodeId: param.episodeId,
    };

    it('should update episode', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        episode,
      });

      const result = await service.updateEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(getEpisodeParam);

      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith({
        ...episode,
        title: param.title,
      });

      expect(result).toEqual({ ok: true });
    });

    it('should not found episode', async () => {
      jest
        .spyOn(service, 'getEpisode')
        .mockResolvedValue({ ok: false, error: 'not found' });

      const result = await service.updateEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(getEpisodeParam);

      expect(result).toEqual({ ok: false, error: 'not found' });
    });

    it('should fail on internal server error', async () => {
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error());

      const result = await service.updateEpisode(param);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(getEpisodeParam);

      expect(result).toEqual(internalServerErrorOutput);
    });
  });
});
