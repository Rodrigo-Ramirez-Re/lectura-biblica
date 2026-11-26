import { Component, provideAppInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppTitleStrategy } from './app-title-strategy';
import { focusHeadingOnNavigation } from './focus-on-navigation';

@Component({ template: '<main><h1>Hoy</h1><button>Ya leí</button></main>' })
class TodayScreen {}

@Component({ template: '<main><h1>Plan</h1></main>' })
class PlanScreen {}

@Component({ template: '<main><p>Sin título</p></main>' })
class UntitledScreen {}

async function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: '', component: TodayScreen },
        { path: 'plan', title: 'Plan', component: PlanScreen },
        { path: 'vacio', component: UntitledScreen },
      ]),
      { provide: TitleStrategy, useClass: AppTitleStrategy },
      provideAppInitializer(() => focusHeadingOnNavigation()),
    ],
  });
  const harness = await RouterTestingHarness.create();
  return { harness, title: () => TestBed.inject(Title).getTitle() };
}

describe('screen titles (LB-006)', () => {
  it('names the screen and the app in the tab', async () => {
    const { harness, title } = await setup();

    await harness.navigateByUrl('/plan');

    expect(title()).toBe('Plan · Lectura bíblica');
  });

  it('uses the app name alone for a screen without a title', async () => {
    const { harness, title } = await setup();

    await harness.navigateByUrl('/vacio');

    expect(title()).toBe('Lectura bíblica');
  });
});

describe('focus after navigating (LB-006)', () => {
  it('leaves the focus alone on the first load', async () => {
    const { harness } = await setup();

    await harness.navigateByUrl('/');

    expect(document.activeElement).toBe(document.body);
  });

  it("moves the focus to the new screen's heading", async () => {
    const { harness } = await setup();
    await harness.navigateByUrl('/');

    await harness.navigateByUrl('/plan');

    const heading = document.querySelector<HTMLElement>('main h1');
    expect(heading?.textContent).toBe('Plan');
    expect(document.activeElement).toBe(heading);
    expect(heading?.getAttribute('tabindex')).toBe('-1');
  });

  it('does nothing on a screen without a heading', async () => {
    const { harness } = await setup();
    await harness.navigateByUrl('/');

    await harness.navigateByUrl('/vacio');

    expect(document.activeElement).toBe(document.body);
  });
});
