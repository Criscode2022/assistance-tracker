import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NeonService } from './neon.service';

describe('NeonService', () => {
  let service: NeonService;
  const translate = {
    instant: jasmine.createSpy('instant').and.callFake((key: string) => key),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NeonService,
        { provide: TranslateService, useValue: translate },
      ],
    });
    service = TestBed.inject(NeonService);
  });

  it('resolves same-origin proxy paths against window.location', () => {
    expect(service['resolveUrl']('/__neon-auth')).toBe(
      `${window.location.origin}/__neon-auth`,
    );
  });

  it('leaves absolute Neon URLs unchanged', () => {
    const remote = 'https://ep-example.neonauth.aws.neon.tech/neondb/auth';
    expect(service['resolveUrl'](remote)).toBe(remote);
  });

  it('maps auth errors through the i18n key table', () => {
    expect(service.getAuthErrorMessage({ code: 'USER_ALREADY_EXISTS' })).toBe(
      'AUTH.ERRORS.USER_ALREADY_EXISTS',
    );
    expect(translate.instant).toHaveBeenCalledWith(
      'AUTH.ERRORS.USER_ALREADY_EXISTS',
    );
  });
});
