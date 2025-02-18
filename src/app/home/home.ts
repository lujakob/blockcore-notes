import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { Utilities } from '../services/utilities';
import { relayInit, Relay, Event } from 'nostr-tools';
import * as moment from 'moment';
import { DataValidation } from '../services/data-validation';
import { NostrEvent, NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { SettingsService } from '../services/settings';
import { NotesService } from '../services/notes';
import { map, Observable, shareReplay, Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialog } from '../shared/create-note-dialog/create-note-dialog';
import { OptionsService } from '../services/options';
import { AuthenticationService } from '../services/authentication';
import { NavigationService } from '../services/navigation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { DataService } from '../services/data';
import { StorageService } from '../services/storage';

interface DefaultProfile {
  pubkey: string;
  pubkeynpub: string;
  name: string;
  picture: string;
  about: string;
  checked: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  // animations: [
  //   trigger('fade', [
  //     transition('void => active', [
  //       // using status here for transition
  //       style({ opacity: 0 }),
  //       animate(250, style({ opacity: 1 })),
  //     ]),
  //     transition('* => void', [animate(250, style({ opacity: 0 }))]),
  //   ]),
  // ],
})
export class HomeComponent {
  publicKey?: string | null;
  subscriptions: Subscription[] = [];

  lists = [
    { name: 'Nostr', about: 'Influencial nostr developers and community people', pubkey: 'npub15xrwvftyzynahpl5fmpuv9wtkg9q52j8q73saw59u8tmx63ktx8sfclgss', pubkeyhex: 'a186e625641127db87f44ec3c615cbb20a0a2a4707a30eba85e1d7b36a36598f' },
    { name: 'Bitcoin', about: 'Influencial Bitcoin people', pubkey: 'npub175ag9cus82a0zzpkheaglnudpvsc8q046z82cyz9gmauzlve6r2s4k9fpm', pubkeyhex: 'f53a82e3903abaf10836be7a8fcf8d0b218381f5d08eac104546fbc17d99d0d5' },
    { name: 'Blockcore', about: 'Follow the Blockcore developers', pubkey: 'npub1zfy0r7x8s3xukajewkmmzxjj3wpfan7apj5y7szz7y740wtf6p5q3tdyy9', pubkeyhex: '1248f1f8c7844dcb765975b7b11a528b829ecfdd0ca84f4042f13d57b969d068' },
  ];

  defaults: DefaultProfile[] = [
    {
      pubkeynpub: 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
      pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      name: 'fiatjaf',
      picture: 'https://pbs.twimg.com/profile_images/539211568035004416/sBMjPR9q_normal.jpeg',
      about: 'buy my merch at fiatjaf store',
      checked: false,
    },
    {
      pubkeynpub: 'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m',
      pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      name: 'jack',
      picture: 'https://pbs.twimg.com/profile_images/1115644092329758721/AFjOr-K8_normal.jpg',
      about: 'bitcoin...twttr/@jack',
      checked: false,
    },
    {
      pubkeynpub: 'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s',
      pubkey: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
      name: 'jb55',
      picture: 'https://pbs.twimg.com/profile_images/1362882895669436423/Jzsp1Ikr_normal.jpg',
      about: 'damus.io author. bitcoin and nostr dev',
      checked: false,
    },
    {
      pubkeynpub: 'npub1v4v57fu60zvc9d2uq23cey4fnwvxlzga9q2vta2n6xalu03rs57s0mxwu8',
      pubkey: '65594f279a789982b55c02a38c92a99b986f891d2814c5f553d1bbfe3e23853d',
      name: 'hampus',
      picture: 'https://pbs.twimg.com/profile_images/1517505111991504896/9qixSAMn_normal.jpg',
      about: '',
      checked: false,
    },
    {
      pubkeynpub: 'npub1zl3g38a6qypp6py2z07shggg45cu8qex992xpss7d8zrl28mu52s4cjajh',
      pubkey: '17e2889fba01021d048a13fd0ba108ad31c38326295460c21e69c43fa8fbe515',
      name: 'sondreb',
      picture: 'https://sondreb.com/favicon.png',
      about: 'Developer 🦸‍♂️ of Blockcore Notes and Blockcore Wallet',
      checked: false,
    },
  ];

  // #defaultsChanged: BehaviorSubject<DefaultProfile[]> = new BehaviorSubject<DefaultProfile[]>(this.defaults);

  // THIS CAUSED MASSIVE MEMORY LEAK!!
  // get defaults$(): Observable<DefaultProfile[]> {
  //   return combineLatest([this.#defaultsChanged, this.profileService.items$]).pipe(
  //     map(([defaultProfiles, followProfiles]) => {
  //       return defaultProfiles.filter((item) => {
  //         debugger;
  //         if (followProfiles.find((p) => p.pubkey === item.pubkey) != null) {
  //           return undefined;
  //         } else {
  //           return item;
  //         }
  //       });
  //     })
  //   );
  // }

  constructor(
    private db: StorageService,
    public appState: ApplicationState,
    private cd: ChangeDetectorRef,
    public options: OptionsService,
    public dialog: MatDialog,
    public profileService: ProfileService,
    private validator: DataValidation,
    public navigationService: NavigationService,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private snackBar: MatSnackBar,
    private dataService: DataService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone
  ) {
    console.log('HOME constructor!!'); // Hm.. called twice, why?
  }

  downloadProfiles() {
    const array = [
      '00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700',
      '17e2889fba01021d048a13fd0ba108ad31c38326295460c21e69c43fa8fbe515',
      '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
      '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      '65594f279a789982b55c02a38c92a99b986f891d2814c5f553d1bbfe3e23853d',
      '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      'a341f45ff9758f570a21b000c17d4e53a3a497c8397f26c0e6d61e5acffc7a98',
      'd987084c48390a290f5d2a34603ae64f55137d9b4affced8c0eae030eb222a25',
      'edcd20558f17d99327d841e4582f9b006331ac4010806efa020ef0d40078e6da',
    ];

    array.map((pubkey) => {
      this.dataService.enque({ identifier: pubkey, type: 'Profile' });
    });

    // const observable = this.dataService.downloadNewestProfiles(array);

    // .subscribe((profile) => {
    //   console.log('PROFILE RECEIVED:', profile);

    //   // let doc = profile as NostrEventDocument;
    //   // const index = array.findIndex((a) => a == doc.pubkey);

    //   // if (index > -1) {
    //   //   array.splice(index, 1);
    //   // }

    //   // if (array.length === 0) {
    //   //   console.log('FOUND ALL!!!!');
    //   // }
    // });

    // setInterval(() => {
    //   console.log('observable.closed:', observable.closed);
    // }, 250);
  }

  downloadProfiles2() {
    const array = [
      '00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700',
      '17e2889fba01021d048a13fd0ba108ad31c38326295460c21e69c43fa8fbe515',
      '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
      '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      '65594f279a789982b55c02a38c92a99b986f891d2814c5f553d1bbfe3e23853d',
      '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      'a341f45ff9758f570a21b000c17d4e53a3a497c8397f26c0e6d61e5acffc7a98',
      'd987084c48390a290f5d2a34603ae64f55137d9b4affced8c0eae030eb222a25',
      'edcd20558f17d99327d841e4582f9b006331ac4010806efa020ef0d40078e6da',
    ];

    const observable = this.profileService.getProfile(array[0]).subscribe(async (profile) => {
      console.log('GOT CACHED PROFILE:', profile);

      debugger;
      await this.profileService.follow(profile.pubkey);
    });

    // this.profileService.getProfile(array[1]).subscribe((profile) => {
    //   console.log('GOT CACHED PROFILE:', profile);
    // });

    // this.profileService.getProfile(array[2]).subscribe((profile) => {
    //   console.log('GOT CACHED PROFILE:', profile);
    // });

    // this.profileService.getProfile(array[3]).subscribe((profile) => {
    //   console.log('GOT CACHED PROFILE:', profile);
    // });

    // const observable = this.profileService.getProfile2(array[0]).dataService.downloadNewestProfiles(array).subscribe((profile) => {
    //   console.log('PROFILE RECEIVED:', profile);

    //   let doc = profile as NostrEventDocument;

    //   const index = array.findIndex((a) => a == doc.pubkey);

    //   if (index > -1) {
    //     array.splice(index, 1);
    //   }

    //   if (array.length === 0) {
    //     console.log('FOUND ALL!!!!');
    //   }
    // });

    // setInterval(() => {
    //   console.log('observable.closed:', observable.closed);
    // }, 2000);
  }

  subscribeEvents() {
    const observable = this.dataService.subscribeLatestEvents([1], [], 100).subscribe((event) => {
      console.log('EVENT RECEIVED:', event);
    });

    // setInterval(() => {
    //   console.log('observable.closed:', observable.closed);
    // }, 2000);

    // setTimeout(() => {
    //   observable.unsubscribe();
    // }, 20000);
  }

  subscribeEvents2() {
    const observable = this.dataService.subscribeLatestEvents([0, 3], [], 100).subscribe((event) => {
      console.log('EVENT RECEIVED22:', event);
    });

    // setInterval(() => {
    //   console.log('observable.closed22:', observable.closed);
    // }, 2000);

    // setTimeout(() => {
    //   observable.unsubscribe();
    // }, 20000);
  }

  async follow(profile: DefaultProfile) {
    if (profile.checked) {
      await this.profileService.follow(profile.pubkey, 0, profile as any);

      // this.feedService.downloadRecent([profile.pubkeyhex]);

      // Perform a detected changes now, since 'profileService.profiles.length' should be updated.
      // this.#defaultsChanged.next(this.defaults);
      // this.profileService.updated();
    }
  }

  // async follow() {
  //   const pubKeys = this.defaults.filter((p) => p.checked);

  //   if (pubKeys.length === 0) {
  //     return;
  //   }

  //   for (let i = 0; i < pubKeys.length; i++) {
  //     console.log('LOOP KEY:', pubKeys[i]);
  //     await this.profileService.follow(pubKeys[i].pubkeyhex, undefined, pubKeys[i] as any);
  //   }

  //   this.feedService.downloadRecent(pubKeys.map((p) => p.pubkeyhex));

  //   // Perform a detected changes now, since 'profileService.profiles.length' should be updated.
  //   this.cd.detectChanges();
  // }

  optionsUpdated() {
    // this.allComplete = this.task.subtasks != null && this.task.subtasks.every(t => t.completed);
    // Parse existing content.
    this.events = this.validator.filterEvents(this.events);
  }

  public trackByFn(index: number, item: NostrEvent) {
    return item.id;
  }

  public trackByProfile(index: number, item: DefaultProfile) {
    return `${item.pubkey}${item.checked}`;
  }

  public trackByNoteId(index: number, item: NostrNoteDocument) {
    return item.id;
  }

  events: NostrEvent[] = [];
  sub: any;
  relay?: Relay;
  initialLoad = true;

  details = false;

  toggleDetails() {
    this.details = !this.details;
  }

  async clearDatabase() {
    this.db
      .delete()
      .then(() => {
        console.log('Database successfully deleted');
      })
      .catch((err) => {
        console.error('Could not delete database');
      })
      .finally(() => {
        // Do what should be done next...
      });

    location.reload();
  }

  import(pubkey: string) {
    this.dataService.enque({
      identifier: pubkey,
      type: 'Contacts',
      callback: (data: NostrEventDocument) => {
        console.log('DATA RECEIVED', data);

        const following = data.tags.map((t) => t[1]);

        for (let i = 0; i < following.length; i++) {
          const publicKey = following[i];
          this.profileService.follow(publicKey);
        }
      },
    });
  }

  // import(pubkey: string) {
  //   // TODO: This is a copy-paste of code in circles, refactor ASAP!

  //   this.snackBar.open('Importing followers process has started', 'Hide', {
  //     duration: 2000,
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom',
  //   });

  //   pubkey = this.utilities.ensureHexIdentifier(pubkey);

  //   this.dataService.downloadNewestContactsEvents([pubkey]).subscribe((event) => {
  //     const nostrEvent = event as NostrEventDocument;
  //     const publicKeys = nostrEvent.tags.map((t) => t[1]);

  //     for (let i = 0; i < publicKeys.length; i++) {
  //       const publicKey = publicKeys[i];
  //       this.profileService.follow(publicKey);
  //     }
  //   });

  //   // TODO: Add ability to slowly query one after one relay, we don't want to receive multiple
  //   // follow lists and having to process everything multiple times. Just query one by one until
  //   // we find the list. Until then, we simply grab the first relay only.
  //   // this.subscriptions.push(
  //   //   this.feedService.downloadContacts(pubkey).subscribe(async (contacts) => {
  //   //     const publicKeys = contacts.tags.map((t) => t[1]);

  //   //     for (let i = 0; i < publicKeys.length; i++) {
  //   //       const publicKey = publicKeys[i];
  //   //       const profile = await this.profileService.getProfile(publicKey);

  //   //       // If the user already exists in our database of profiles, make sure we keep their previous circle (if unfollowed before).
  //   //       if (profile) {
  //   //         await this.profileService.follow(publicKeys[i], profile.circle);
  //   //       } else {
  //   //         await this.profileService.follow(publicKeys[i]);
  //   //       }
  //   //     }

  //   //     this.router.navigateByUrl('/people');

  //   //     // this.ngZone.run(() => {
  //   //     //   this.cd.detectChanges();
  //   //     // });
  //   //   })
  //   // );
  // }

  fetchProfiles(relay: Relay, authors: string[]) {
    // const filteredAuthors = authors.filter((a) => {
    //   return this.profile.profiles[a] == null;
    // });
    // console.log('authors:', authors);
    // console.log('filteredAuthors:', filteredAuthors);
    // if (filteredAuthors.length === 0) {
    //   return;
    // }
    // const profileSub = relay.sub([{ kinds: [0], authors: authors }], {});
    // profileSub.on('event', async (originalEvent: NostrEvent) => {
    //   const event = this.processEvent(originalEvent);
    //   if (!event) {
    //     return;
    //   }
    //   // const parsed = this.validator.sanitizeProfile(event);
    //   // const test1 = JSON.parse('{"name":"stat","picture":"https://i.imgur.com/s1scsdH_d.webp?maxwidth=640&amp;shape=thumb&amp;fidelity=medium","about":"senior software engineer at amazon\\n\\n#bitcoin","nip05":"stat@no.str.cr"}');
    //   // console.log('WHAT IS WRONG WITH THIS??');
    //   // console.log(test1);
    //   try {
    //     const profile = this.validator.sanitizeProfile(JSON.parse(event.content) as NostrProfileDocument) as NostrProfileDocument;
    //     // Persist the profile.
    //     await this.profile.putProfile(event.pubkey, profile);
    //     const displayName = encodeURIComponent(profile.name);
    //     const url = `https://www.nostr.directory/.well-known/nostr.json?name=${displayName}`;
    //     const rawResponse = await fetch(url, {
    //       method: 'GET',
    //       mode: 'cors',
    //     });
    //     if (rawResponse.status === 200) {
    //       const content = await rawResponse.json();
    //       const directoryPublicKey = content.names[displayName];
    //       if (event.pubkey === directoryPublicKey) {
    //         if (!profile.verifications) {
    //           profile.verifications = [];
    //         }
    //         profile.verifications.push('@nostr.directory');
    //         // Update the profile with verification data.
    //         await this.profile.putProfile(event.pubkey, profile);
    //       } else {
    //         // profile.verified = false;
    //         console.warn('Nickname reuse:', url);
    //       }
    //     } else {
    //       // profile.verified = false;
    //     }
    //   } catch (err) {
    //     console.warn('This profile event was not parsed due to errors:', event);
    //   }
    // });
    // profileSub.on('eose', () => {
    //   profileSub.unsub();
    // });
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  feedChanged($event: any, type: string) {
    if (type === 'public') {
      // If user choose public and set the value to values, we'll turn on the private.
      if (!this.options.options.publicFeed) {
        this.options.options.privateFeed = true;
      } else {
        this.options.options.privateFeed = false;
      }
    } else {
      // If user choose private and set the value to values, we'll turn on the public.
      if (!this.options.options.privateFeed) {
        this.options.options.publicFeed = true;
      } else {
        this.options.options.publicFeed = false;
      }
    }
  }

  // async optionsUpdated($event: any, type: any) {
  //   if (type == 1) {
  //     this.showCached = false;
  //   } else {
  //     this.showBlocked = false;
  //   }

  //   await this.load();
  // }

  async ngOnInit() {
    this.options.options.privateFeed = true;

    // useReactiveContext // New construct in Angular 14 for subscription.
    // https://medium.com/generic-ui/the-new-way-of-subscribing-in-an-angular-component-f74ef79a8ffc

    this.appState.updateTitle('');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'note_add',
        tooltip: 'Create Note',
        click: () => {
          this.navigationService.createNote();
        },
      },
    ];
  }
}
