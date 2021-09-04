import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationPanelComponent } from './animation-panel.component';

describe('AnimationPanelComponent', () => {
  let component: AnimationPanelComponent;
  let fixture: ComponentFixture<AnimationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnimationPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
