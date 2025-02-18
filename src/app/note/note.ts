import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { OptionsService } from '../services/options';
import { ThreadService } from '../services/thread';
import { NavigationService } from '../services/navigation';

@Component({
  selector: 'app-note',
  templateUrl: './note.html',
  styleUrls: ['./note.css'],
})
export class NoteComponent {
  id?: string | null;
  event?: NostrEventDocument;

  constructor(
    public appState: ApplicationState,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public optionsService: OptionsService,
    public navigation: NavigationService,
    public profiles: ProfileService,
    public thread: ThreadService,
    private validator: DataValidation,
    private utilities: Utilities,
    private router: Router
  ) {}

  // TODO: Nasty code, just fix it, quick hack before bed.
  likes(event: NostrEventDocument) {
    // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
    //   const eTag = e.tags.find((p) => p[0] === 'e');
    //   const eTagValue = eTag![1];
    //   return eTagValue != '-';
    // });
    // return eventsWithSingleeTag.length;
  }

  // TODO: Nasty code, just fix it, quick hack before bed.
  dislikes(event: NostrEventDocument) {
    // let eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind == 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // eventsWithSingleeTag = eventsWithSingleeTag.filter((e) => {
    //   const eTag = e.tags.find((p) => p[0] === 'e');
    //   const eTagValue = eTag![1];
    //   return eTagValue == '-';
    // });
    // return eventsWithSingleeTag.length;
  }

  replies(event: NostrEventDocument) {
    // const eventsWithSingleeTag = this.feedService.thread.filter((e) => e.kind != 7 && e.tags.filter((p) => p[0] === 'e').length == 1);
    // return eventsWithSingleeTag.length;
  }

  filteredThread() {
    // return this.feedService.thread.filter((p) => p.kind != 7);
  }

  repliesTo(event: NostrEventDocument) {
    if (!event) {
      return;
    }

    let tags = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
    tags = tags.filter((t) => t !== event.pubkey);

    return tags;
  }

  parentEvent?: NostrEventDocument;

  /** Returns the root event, first looks for "root" attribute on the e tag element or picks first in array. */
  rootEvent() {
    if (!this.event) {
      return;
    }

    // TODO. All of this parsing of arrays is silly and could be greatly improved with some refactoring
    // whenever I have time for it.
    const eTags = this.event.tags.filter((t) => t[0] === 'e');

    for (let i = 0; i < eTags.length; i++) {
      const tag = eTags[i];

      // If more than 4, we likely have "root" or "reply"
      if (tag.length > 3) {
        if (tag[3] == 'root') {
          return tag[1];
        }
      }
    }

    return eTags[0][1];
  }

  ngOnInit() {
    console.log('CURRENT EVENT:', this.navigation.currentEvent);

    if (this.navigation.currentEvent) {
      this.id = this.navigation.currentEvent.id;
      this.thread.changeSelectedEvent(undefined, this.navigation.currentEvent);
    }

    this.appState.updateTitle('Thread');
    this.appState.showBackButton = true;

    this.activatedRoute.paramMap.subscribe(async (params) => {
      const id: string | null = params.get('id');

      if (!id) {
        this.router.navigateByUrl('/');
        return;
      }

      if (id.startsWith('note')) {
        const convertedId = this.utilities.convertFromBech32ToHex(id);
        this.router.navigate(['/e', convertedId]);
        return;
      }

      this.thread.changeSelectedEvent(id);
    });
  }

  // optionsUpdated() {
  //   // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
  //   // Parse existing content.
  //   // this.events = this.validator.filterEvents(this.events);
  // }

  // activeOptions() {
  //   let options = '';

  //   if (this.options.options.hideSpam) {
  //     options += ' Spam: Filtered';
  //   } else {
  //     options += ' Spam: Allowed';
  //   }

  //   if (this.options.options.hideInvoice) {
  //     options += ' Invoices: Hidden';
  //   } else {
  //     options += ' Invoices: Displayed';
  //   }

  //   return options;
  // }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  sub: any;
  initialLoad = true;

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsub();
    }
  }
}
