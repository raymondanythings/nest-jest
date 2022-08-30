import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const TOKEN = 'signed-token';
const mockJwtService = () => ({
  sign: jest.fn(() => TOKEN),
  verify: jest.fn(),
});
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
});
describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be define', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('createAccount', () => {
    const user: Partial<User> = {
      email: '123@222.222',
      password: '1234',
      role: UserRole.Host,
    };

    it('should create account', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(user);
      const result = await service.createAccount(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: user.email,
      });

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(user);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(user);

      expect(result).toEqual({ ok: true, error: null });
    });

    it('should fail on exist user', async () => {
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.create.mockReturnValue(user);
      const result = await service.createAccount(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: user.email,
      });

      expect(result).toEqual({
        ok: false,
        error: `There is a user with that email already`,
      });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());

      const result = await service.createAccount(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: user.email,
      });

      expect(result).toEqual({
        ok: false,
        error: 'Could not create account',
      });
    });
  });

  describe('login', () => {
    const user = {
      email: '123@222.222',
      password: '1234',
    };

    it('should login', async () => {
      const mockUser = {
        ...user,
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        { email: user.email },
        expect.any(Object),
      );

      expect(mockUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.checkPassword).toHaveBeenCalledWith(user.password);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(mockUser.id);

      expect(result).toEqual({ ok: true, token: TOKEN });
    });

    it('should fail cause not found user', async () => {
      const mockUser = {
        ...user,
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        { email: user.email },
        expect.any(Object),
      );

      expect(result).toEqual({ ok: false, error: 'User not found' });
    });

    it('should incurrect password', async () => {
      const mockUser = {
        ...user,
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        { email: user.email },
        expect.any(Object),
      );

      expect(mockUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.checkPassword).toHaveBeenCalledWith(user.password);

      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should fail on error', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(user);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        { email: user.email },
        expect.any(Object),
      );

      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });
  });

  describe('findById', () => {
    const id = 1;
    const user = {
      email: '123@222.222',
      password: '1234',
    };
    it('should find', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(user);
      const result = await service.findById(id);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({ id });

      expect(result).toEqual({ ok: true, user });
    });

    it('should not found or error', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(id);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({ id });

      expect(result).toEqual({
        ok: false,
        error: 'User Not Found',
      });
    });
  });

  describe('editProfile', () => {
    const id = 1;
    const user = {
      email: '123@222.222',
      password: '1234',
    };

    const editParam = {
      email: '345@333.333',
      password: '3434',
    };

    it('should edit profile', async () => {
      usersRepository.findOne.mockResolvedValue(user);
      const result = await service.editProfile(id, editParam);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(id);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editParam);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on error', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(id, editParam);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(id);

      expect(result).toEqual({ ok: false, error: 'Could not update profile' });
    });
  });
});
