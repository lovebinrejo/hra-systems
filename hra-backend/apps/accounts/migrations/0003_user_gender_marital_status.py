from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_must_change_password_adminpasswordresetrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='marital_status',
            field=models.CharField(
                blank=True,
                choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')],
                max_length=10,
            ),
        ),
    ]
