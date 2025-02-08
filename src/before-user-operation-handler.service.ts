import { Injectable } from '@stlmpp/di';
import { type Handler } from '@st-api/core';
import { AuthBlockingEvent, HttpsError } from 'firebase-functions/identity';
import { FirebaseAdminFirestore } from '@st-api/firebase';
import { FirestoreDataConverter } from 'firebase-admin/firestore';

const converter: FirestoreDataConverter<{ allowed: boolean }> = {
  toFirestore(
    modelObject: FirebaseFirestore.WithFieldValue<{
      allowed: boolean;
    }>,
  ): FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData> {
    return modelObject;
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): {
    allowed: boolean;
  } {
    return {
      allowed: !!snapshot.get('allowed'),
    };
  },
};

@Injectable()
export class BeforeUserOperationHandler implements Handler {
  constructor(firestore: FirebaseAdminFirestore) {
    this.collection = firestore
      .collection('allowed_user')
      .withConverter(converter);
  }

  private readonly collection;

  async handle(event: AuthBlockingEvent): Promise<void> {
    const error = new HttpsError(
      'permission-denied',
      'User is not allowed',
      {},
    );

    if (!event.data?.email) {
      throw error;
    }

    const record = await this.collection.doc(event.data.email).get();

    if (!record.data()?.allowed) {
      throw error;
    }
  }
}
